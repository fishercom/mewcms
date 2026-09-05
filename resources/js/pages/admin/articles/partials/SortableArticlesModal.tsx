import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CmsArticle } from '@/types/models/cms-article';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ReactSortable } from 'react-sortablejs';

interface SortableArticlesModalProps {
    isOpen: boolean;
    onClose: () => void;
    articles: CmsArticle[];
}

export default function SortableArticlesModal({ isOpen, onClose, articles }: SortableArticlesModalProps) {
    const [sortedArticles, setSortedArticles] = useState<CmsArticle[]>([]);

    useEffect(() => {
        setSortedArticles(articles);
    }, [articles]);

    const handleSort = (sortedList: CmsArticle[]) => {
        setSortedArticles(sortedList);
    };

    const handleSave = () => {
        axios
            .post(route('articles.sort'), { articles: sortedArticles })
            .then(() => {
                onClose();
            })
            .catch((error) => {
                console.error('Error saving sorted articles:', error);
            });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ordenar Artículos</DialogTitle>
                    <DialogDescription>Arrastra y suelta los artículos para cambiar su orden.</DialogDescription>
                </DialogHeader>
                <div className="p-4">
                    <ReactSortable list={sortedArticles} setList={handleSort}>
                        {sortedArticles.map((article) => (
                            <div key={article.id} className="my-1 cursor-move rounded border p-2">
                                {article.title}
                            </div>
                        ))}
                    </ReactSortable>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} variant="outline">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
