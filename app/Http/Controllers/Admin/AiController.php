<?php

namespace App\Http\Controllers\Admin;

use App\Ai\AiException;
use App\Ai\AiManager;
use App\Ai\AiSettings;
use App\Ai\ContentAssistant;
use App\Http\Controllers\Controller;
use App\Models\AdmAction;
use App\Models\CmsAiUsage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The "Asistente IA" module: its settings page and the assistant's endpoints. Using the
 * assistant needs the module's manage action; changing its settings also needs
 * Configuración's, so editors can use it without touching the budget.
 */
class AiController extends Controller
{
    public function __construct(protected AiManager $ai) {}

    public function index(Request $request): Response
    {
        $since = now()->startOfMonth();
        $model = $this->ai->model();
        $fastModel = $this->ai->model('fast');
        $provider = $this->ai->providerKey($model);

        return Inertia::render('admin/ai/index', [
            'setup' => [
                'enabled' => $this->ai->enabled(),
                'has_key' => filled(config('ai.key')),
                'provider' => $provider ? config("ai.providers.$provider.name") : null,
                'model' => ['id' => $model, 'price' => $this->ai->price($model)],
                'fast_model' => $fastModel !== $model ? ['id' => $fastModel, 'price' => $this->ai->price($fastModel)] : null,
                'mixed_providers' => $this->ai->providerKey($fastModel) !== $provider,
            ],
            'catalog' => collect(config('ai.providers'))->except('custom')->map(fn (array $provider): array => [
                'name' => $provider['name'],
                'models' => collect($provider['models'])->map(fn (array $price, string $id): array => ['id' => $id, ...$price])->values(),
            ])->values(),
            'settings' => AiSettings::all(),
            'usage' => [
                'spent' => round($this->ai->monthSpent(), 4),
                'calls' => CmsAiUsage::where('created_at', '>=', $since)->count(),
                'by_model' => CmsAiUsage::where('created_at', '>=', $since)
                    ->selectRaw('model, count(*) as calls, sum(input_tokens) as input_tokens, sum(output_tokens) as output_tokens, sum(cost) as cost')
                    ->groupBy('model')
                    ->orderByDesc('cost')
                    ->get(),
                'recent' => CmsAiUsage::with('user:id,name')->latest('id')->limit(10)->get(),
            ],
            'can_configure' => $this->canConfigure($request),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($this->canConfigure($request), 403);

        $data = $request->validate([
            'monthly_budget' => 'required|numeric|min:0|max:100000',
            'tone' => 'required|string|max:120',
            'audience' => 'nullable|string|max:255',
        ]);

        AiSettings::save([...$data, 'audience' => $data['audience'] ?? '']);

        return back();
    }

    /**
     * "Probar conexión": the smallest possible call with the fast model.
     */
    public function test(Request $request): JsonResponse
    {
        abort_unless($this->canConfigure($request), 403);

        try {
            $this->ai->run('fast', 'test', 'Responde solo con la palabra OK.', 'Prueba de conexión.', null, $request->user(), maxTokens: 64);
        } catch (AiException $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json(['ok' => true, 'message' => __('Conexión correcta con :model.', ['model' => $this->ai->model('fast')])]);
    }

    /**
     * "Sugerir metadatos" for the page or post being edited, unsaved changes included.
     */
    public function metadata(Request $request, ContentAssistant $assistant): JsonResponse
    {
        $data = $request->validate([
            'module' => 'required|in:articles,posts',
            'keyword' => 'nullable|string|max:100',
            'id' => 'nullable|integer',
            'lang_id' => 'nullable|integer',
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'blocks' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);
        abort_unless($request->user()->hasAdminPermission($data['module'], AdmAction::MANAGE), 403);

        try {
            return response()->json($assistant->metadata($data, $data['module'], $data['keyword'] ?? null, $request->user()));
        } catch (AiException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * "Mejorar bloque": the block's texts rewritten, as a preview the editor accepts or discards.
     */
    public function improveBlock(Request $request, ContentAssistant $assistant): JsonResponse
    {
        $data = $request->validate([
            'block.type' => 'required|string|max:60',
            'block.data' => 'required|array',
            'action' => ['required', Rule::in(ContentAssistant::BLOCK_ACTIONS)],
            'option' => 'nullable|string|max:20',
            'title' => 'nullable|string|max:255',
            'lang_id' => 'nullable|integer',
        ]);

        try {
            $result = $assistant->improveBlock($data['block'], $data['action'], $data['option'] ?? null, $data, $request->user());
        } catch (AiException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $result]);
    }

    protected function canConfigure(Request $request): bool
    {
        return $request->user()->hasAdminPermission('configs', AdmAction::MANAGE);
    }
}
