import { localePath } from '@/lib/locale-path';
import { useTexts } from '@/lib/theme-texts';
import { CmsArticle } from '@/types/models/cms-article';
import { CmsPost, CmsPostType, PostListItem } from '@/types/models/cms-post';
import { Head } from '@inertiajs/react';
import ArticleView from '../components/article-view';
import FrontLayout from '../layout';

interface Props {
    post: CmsPost;
    cpt: CmsPostType | null;
    navigation: Pick<CmsArticle, 'id' | 'title' | 'slug'>[];
    /** Posts of the same type that share a tag with this one */
    related?: PostListItem[];
}

export default function Show({ post, cpt, navigation, related = [] }: Props) {
    const { t } = useTexts();

    // Custom fields of the post's field group, listed under the text
    const details = Object.entries(post.metadata || {}).filter(
        ([key, value]) => key !== '_id' && !key.startsWith('seo_') && value !== null && value !== '',
    );

    return (
        <FrontLayout navigation={navigation}>
            <Head title={post.title} />
            <ArticleView
                title={post.title}
                excerpt={post.excerpt}
                image={post.featured_image}
                date={post.published_at}
                author={post.user?.name}
                blocks={post.blocks}
                html={post.content}
                tags={post.tags ?? []}
                details={details}
                back={{ label: cpt ? cpt.name : t('blog.title'), url: localePath(cpt ? `/${cpt.slug}` : '/blog') }}
                related={related}
            />
        </FrontLayout>
    );
}
