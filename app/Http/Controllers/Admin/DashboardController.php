<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmLog;
use App\Models\CmsArticle;
use App\Models\CmsRegister;
use App\Models\CmsTaxonomyTerm;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Render the admin dashboard home page.
     */
    public function index(Request $request): Response
    {
        // 1. Key Metrics Summary
        $totalArticles = CmsArticle::count();
        $activeArticles = CmsArticle::where('active', '1')->count();
        $totalTerms = CmsTaxonomyTerm::count();
        $totalMessages = CmsRegister::count();
        $unreviewedMessages = CmsRegister::where(function ($query) {
            $query->where('review', 0)->orWhereNull('review');
        })->count();

        // 2. Scan Disk Usage on 'public' Storage Disk
        $fileCount = 0;
        $totalSize = 0;
        try {
            $disk = Storage::disk('public');
            // Recursively get all files
            $files = $disk->allFiles();
            $fileCount = count($files);
            foreach ($files as $file) {
                try {
                    $totalSize += $disk->size($file);
                } catch (\Exception $e) {
                    // Ignore individual file size check failures
                }
            }
        } catch (\Exception $e) {
            // Fallback if public disk storage issues exist
        }

        // Format size
        if ($totalSize >= 1073741824) {
            $formattedSize = round($totalSize / 1073741824, 2).' GB';
        } elseif ($totalSize >= 1048576) {
            $formattedSize = round($totalSize / 1048576, 2).' MB';
        } elseif ($totalSize >= 1024) {
            $formattedSize = round($totalSize / 1024, 2).' KB';
        } else {
            $formattedSize = $totalSize.' B';
        }

        // 3. Recent Activity logs
        $recentLogs = AdmLog::with(['user', 'event.action', 'event.module'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'comment' => $log->comment,
                    'user_name' => $log->user ? $log->user->name : 'System',
                    'created_at' => $log->created_at ? $log->created_at->toISOString() : null,
                ];
            });

        // 4. Monthly Articles created (last 6 months) - Computed in PHP for SQLite/Pest safety
        $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
        $articles = CmsArticle::where('created_at', '>=', $sixMonthsAgo)->get();
        $articlesByMonth = $articles->groupBy(function ($item) {
            return $item->created_at ? $item->created_at->format('Y-m') : '';
        });

        $articlesChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = Carbon::now()->subMonths($i);
            $key = $monthDate->format('Y-m');
            $articlesChart[] = [
                'label' => $monthDate->translatedFormat('M Y'),
                'value' => isset($articlesByMonth[$key]) ? $articlesByMonth[$key]->count() : 0,
            ];
        }

        // 5. Monthly Contact submissions (last 6 months)
        $messages = CmsRegister::where('created_at', '>=', $sixMonthsAgo)->get();
        $messagesByMonth = $messages->groupBy(function ($item) {
            return $item->created_at ? $item->created_at->format('Y-m') : '';
        });

        $messagesChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = Carbon::now()->subMonths($i);
            $key = $monthDate->format('Y-m');
            $messagesChart[] = [
                'label' => $monthDate->translatedFormat('M Y'),
                'value' => isset($messagesByMonth[$key]) ? $messagesByMonth[$key]->count() : 0,
            ];
        }

        // 6. System Activity trends (daily log entries last 15 days)
        $fifteenDaysAgo = Carbon::now()->subDays(14)->startOfDay();
        $logs = AdmLog::where('created_at', '>=', $fifteenDaysAgo)->get();
        $logsByDay = $logs->groupBy(function ($item) {
            return $item->created_at ? $item->created_at->format('Y-m-d') : '';
        });

        $activityChart = [];
        for ($i = 14; $i >= 0; $i--) {
            $dayDate = Carbon::now()->subDays($i);
            $key = $dayDate->format('Y-m-d');
            $activityChart[] = [
                'label' => $dayDate->translatedFormat('d M'),
                'value' => isset($logsByDay[$key]) ? $logsByDay[$key]->count() : 0,
            ];
        }

        return Inertia::render('admin', [
            'stats' => [
                'total_articles' => $totalArticles,
                'active_articles' => $activeArticles,
                'total_terms' => $totalTerms,
                'total_messages' => $totalMessages,
                'unreviewed_messages' => $unreviewedMessages,
                'file_count' => $fileCount,
                'disk_usage' => $formattedSize,
            ],
            'recentLogs' => $recentLogs,
            'articlesChart' => $articlesChart,
            'messagesChart' => $messagesChart,
            'activityChart' => $activityChart,
        ]);
    }
}
