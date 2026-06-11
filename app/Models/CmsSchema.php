<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsSchema extends Model {

	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */

	use \Rutorika\Sortable\SortableTrait;

	protected $table = 'cms_schemas';
	protected $fillable = ['group_id', 'name', 'fields', 'iterations', 'front_view', 'active'];

	protected static $sortableField = 'position';
	protected static $sortableGroupField = 'group_id';

    protected $casts = [
        'fields' => 'array',
    ];

    public function parent()
    {
        return $this->hasOne('App\Models\CmsSchema', 'id', 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(CmsSchema::class, 'parent_id');
    }

    public function articles()
    {
        return $this->hasMany(CmsArticle::class, 'schema_id');
    }

    public static function getAvailableTemplates()
    {
        $directory = resource_path('js/pages/front/templates');
        if (!is_dir($directory)) {
            return [];
        }

        $templates = [];
        $files = scandir($directory);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..' || !str_ends_with($file, '.tsx')) {
                continue;
            }

            $filePath = $directory . '/' . $file;
            $content = file_get_contents($filePath);
            
            $templateName = null;
            if (preg_match('/Template\s+Name:\s*([^\r\n\*]+)/i', $content, $matches)) {
                $templateName = trim($matches[1]);
            }

            if (!$templateName) {
                $templateName = ucfirst(basename($file, '.tsx'));
            }

            $value = 'front/templates/' . basename($file, '.tsx');

            $templates[] = [
                'name' => $templateName,
                'value' => $value,
                'file' => $file,
            ];
        }

        return $templates;
    }
}
