<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmLog;
use App\Models\CmsArticle;
use App\Models\CmsPost;
use App\Models\CmsRegister;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The admin home: what needs attention today (unread messages, drafts, scheduled
 * items, pages missing SEO), what the site produced, and where to pick work up again.
 * Each section only appears to users who may open the module behind it.
 */
class DashboardController extends Controller
{
    /** Pages and posts are counted together as "content" */
    private const CONTENT = [CmsArticle::class => 'articles', CmsPost::class => 'posts'];

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $can = fn (string $module): bool => $user->hasAdminPermission($module);

        $contentModels = array_keys(array_filter(self::CONTENT, $can));
        $canMessages = $can('registers');

        return Inertia::render('admin', [
            'can' => [
                'articles' => $can('articles'),
                'posts' => $can('posts'),
                'registers' => $canMessages,
                'media' => $can('media'),
                'logs' => $can('logs'),
            ],
            'kpis' => [
                'messages' => $canMessages ? $this->messageKpi() : null,
                'published' => $contentModels ? $this->publishedKpi($contentModels) : null,
                'pipeline' => $contentModels ? $this->pipelineKpi($contentModels) : null,
                'seo' => $contentModels ? $this->seoKpi($contentModels) : null,
            ],
            'inbox' => $canMessages ? $this->inbox() : [],
            'recentContent' => $contentModels ? $this->recentContent($contentModels) : [],
            'trend' => $this->trend($contentModels, $canMessages),
            'recentLogs' => $can('logs') ? $this->recentLogs() : [],
            'storage' => $can('media') ? $this->storageUsage() : null,
        ]);
    }

    /**
     * @return array{unread: int, this_week: int, last_week: int}
     */
    protected function messageKpi(): array
    {
        $weekStart = Carbon::now()->startOfWeek();

        return [
            'unread' => CmsRegister::where(fn (Builder $q) => $q->where('review', 0)->orWhereNull('review'))->count(),
            'this_week' => CmsRegister::where('created_at', '>=', $weekStart)->count(),
            'last_week' => CmsRegister::whereBetween('created_at', [$weekStart->copy()->subWeek(), $weekStart])->count(),
        ];
    }

    /**
     * @param  list<class-string<Model>>  $models
     * @return array{total: int, this_month: int, last_month: int}
     */
    protected function publishedKpi(array $models): array
    {
        $monthStart = Carbon::now()->startOfMonth();
        $sum = fn (callable $scope): int => array_sum(array_map(fn (string $model): int => $scope($model::published())->count(), $models));

        return [
            'total' => $sum(fn (Builder $q) => $q),
            'this_month' => $sum(fn (Builder $q) => $q->where('published_at', '>=', $monthStart)),
            'last_month' => $sum(fn (Builder $q) => $q->whereBetween('published_at', [$monthStart->copy()->subMonth(), $monthStart])),
        ];
    }

    /**
     * Drafts waiting to go out, and what is scheduled next.
     *
     * @param  list<class-string<Model>>  $models
     * @return array{drafts: int, scheduled: int, next: array<string, mixed>|null}
     */
    protected function pipelineKpi(array $models): array
    {
        $drafts = 0;
        $scheduled = 0;
        $next = null;
        foreach ($models as $model) {
            $drafts += $model::where('status', 'draft')->count();
            $upcoming = $model::where('status', 'published')->where('published_at', '>', now());
            $scheduled += (clone $upcoming)->count();
            $first = $upcoming->orderBy('published_at')->first();
            if ($first && (! $next || $first->published_at->lt($next['at']))) {
                $next = ['title' => $first->title, 'at' => $first->published_at, 'edit_url' => $this->editUrl($first)];
            }
        }

        if ($next) {
            $next['at'] = $next['at']->toISOString();
        }

        return ['drafts' => $drafts, 'scheduled' => $scheduled, 'next' => $next];
    }

    /**
     * Published items without a meta description: search engines then make one up.
     *
     * @param  list<class-string<Model>>  $models
     * @return array{missing: int, total: int, items: list<array<string, mixed>>}
     */
    protected function seoKpi(array $models): array
    {
        $missing = collect();
        $total = 0;
        foreach ($models as $model) {
            $items = $model::published()->get(['id', 'title', 'metadata', 'updated_at', ...($model === CmsPost::class ? ['post_type', 'lang_id'] : [])]);
            $total += $items->count();
            $missing = $missing->concat($items->filter(fn (Model $item): bool => trim((string) ($item->metadata['seo_description'] ?? '')) === ''));
        }

        return [
            'missing' => $missing->count(),
            'total' => $total,
            'items' => $missing->sortByDesc('updated_at')->take(5)
                ->map(fn (Model $item): array => ['title' => $item->title, 'edit_url' => $this->editUrl($item)])->values()->all(),
        ];
    }

    /**
     * The latest unread messages, newest first.
     *
     * @return list<array<string, mixed>>
     */
    protected function inbox(): array
    {
        return CmsRegister::with('form:id,name')
            ->where(fn (Builder $q) => $q->where('review', 0)->orWhereNull('review'))
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (CmsRegister $message): array => [
                'id' => $message->id,
                'name' => $message->name ?: ($message->email ?: __('Sin nombre')),
                'email' => $message->email,
                'form' => $message->form?->name,
                'excerpt' => Str::limit(trim(strip_tags((string) $message->message)), 90),
                'created_at' => $message->created_at?->toISOString(),
            ])->all();
    }

    /**
     * Pages and posts edited most recently, to pick work up where it was left.
     *
     * @param  list<class-string<Model>>  $models
     * @return list<array<string, mixed>>
     */
    protected function recentContent(array $models): array
    {
        return collect($models)
            ->flatMap(fn (string $model): Collection => $model::latest('updated_at')->take(6)->get())
            ->sortByDesc('updated_at')
            ->take(6)
            ->map(fn (Model $item): array => [
                'key' => class_basename($item).'-'.$item->getKey(),
                'title' => $item->title ?: __('Sin título'),
                'type' => $item instanceof CmsPost ? 'Entrada' : 'Página',
                'state' => match (true) {
                    $item->status === 'draft' => 'draft',
                    (bool) $item->is_scheduled => 'scheduled',
                    ! $item->active => 'hidden',
                    default => 'published',
                },
                'updated_at' => $item->updated_at?->toISOString(),
                'edit_url' => $this->editUrl($item),
            ])->values()->all();
    }

    /**
     * Content published and messages received per month (last 6 months).
     *
     * @param  list<class-string<Model>>  $models
     * @return list<array{label: string, published: int|null, messages: int|null}>
     */
    protected function trend(array $models, bool $withMessages): array
    {
        if (! $models && ! $withMessages) {
            return [];
        }

        $from = Carbon::now()->subMonths(5)->startOfMonth();
        // Grouped in PHP so it runs the same on MySQL and SQLite
        $byMonth = fn (Collection $dates): Collection => $dates->filter()->countBy(fn (Carbon $date): string => $date->format('Y-m'));

        $published = $byMonth(collect($models)->flatMap(fn (string $model): Collection => $model::published()->where('published_at', '>=', $from)->pluck('published_at')));
        $messages = $withMessages ? $byMonth(CmsRegister::where('created_at', '>=', $from)->pluck('created_at')) : collect();

        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $key = $month->format('Y-m');
            $trend[] = [
                'label' => $month->translatedFormat('M'),
                'published' => $models ? (int) $published->get($key, 0) : null,
                'messages' => $withMessages ? (int) $messages->get($key, 0) : null,
            ];
        }

        return $trend;
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function recentLogs(): array
    {
        return AdmLog::with('user')
            ->latest()
            ->take(6)
            ->get()
            ->map(fn (AdmLog $log): array => [
                'id' => $log->id,
                'comment' => $log->comment,
                'user_name' => $log->user?->name ?? 'Sistema',
                'created_at' => $log->created_at?->toISOString(),
            ])->all();
    }

    /**
     * Files and space used in the public disk (cached: a full scan is slow on large libraries).
     *
     * @return array{files: int, size: string}
     */
    protected function storageUsage(): array
    {
        [$files, $bytes] = Cache::remember('admin.disk_usage', 600, function (): array {
            $files = 0;
            $bytes = 0;
            try {
                $disk = Storage::disk('public');
                foreach ($disk->allFiles() as $file) {
                    $files++;
                    try {
                        $bytes += $disk->size($file);
                    } catch (\Exception) {
                        // A file that vanished mid-scan is skipped
                    }
                }
            } catch (\Exception) {
                // The disk is unavailable: report it as empty
            }

            return [$files, $bytes];
        });

        $units = ['B', 'KB', 'MB', 'GB'];
        $power = $bytes > 0 ? min((int) floor(log($bytes, 1024)), count($units) - 1) : 0;

        return ['files' => $files, 'size' => round($bytes / (1024 ** $power), $power > 1 ? 2 : 0).' '.$units[$power]];
    }

    protected function editUrl(Model $item): string
    {
        return $item instanceof CmsPost
            ? "/admin/posts/{$item->getKey()}/edit?post_type={$item->post_type}&lang_id={$item->lang_id}"
            : "/admin/articles/{$item->getKey()}/edit";
    }
}
