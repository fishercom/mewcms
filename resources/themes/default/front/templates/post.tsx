/**
 * Template Name: Blog Post Detail
 */
import { CmsArticle } from '@/types/models/cms-article';
import { Head } from '@inertiajs/react';
import ArticleView from '../components/article-view';
import FrontLayout from '../layout';

interface PostProps {
    article: CmsArticle;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
}

/** Older field groups kept the text and the picture in custom fields with these names */
const BODY_FIELDS = ['body', 'content', 'descripcion'];
const IMAGE_FIELDS = ['image', 'imagen', 'featured_image'];

/** A page laid out like a blog post */
export default function Post({ article, navigation }: PostProps) {
    const meta = (article.metadata || {}) as Record<string, unknown>;
    const field = (keys: string[]) => keys.map((key) => meta[key]).find((value): value is string => typeof value === 'string' && value !== '');
    const legacyBody = field(BODY_FIELDS);

    const details = Object.entries(meta).filter(
        ([key, value]) => ![...BODY_FIELDS, ...IMAGE_FIELDS, '_id'].includes(key) && !key.startsWith('seo_') && value !== null && value !== '',
    );

    return (
        <FrontLayout navigation={navigation}>
            <Head title={article.title} />
            <ArticleView
                title={article.title}
                excerpt={article.excerpt}
                image={article.featured_image || field(IMAGE_FIELDS)}
                date={article.published_at ?? article.created_at?.toString()}
                blocks={article.blocks?.length ? article.blocks : null}
                html={article.content || legacyBody}
                tags={article.tags ?? []}
                details={details}
            />
        </FrontLayout>
    );
}
