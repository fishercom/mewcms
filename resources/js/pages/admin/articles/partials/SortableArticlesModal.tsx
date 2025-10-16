
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CmsArticle } from "@/types/models/cms-article";
import { ReactSortable } from "react-sortablejs";
import { useState, useEffect } from "react";
import axios from "axios";

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
        axios.post(route('articles.sort'), { articles: sortedArticles })
            .then(() => {
                onClose();
            })
            .catch(error => {
                console.error('Error saving sorted articles:', error);
            });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ordenar Artículos</DialogTitle>
                    <DialogDescription>
                        Arrastra y suelta los artículos para cambiar su orden.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                    <ReactSortable list={sortedArticles} setList={handleSort}>
                        {sortedArticles.map((article) => (
                            <div key={article.id} className="p-2 my-1 border rounded cursor-move">
                                {article.title}
                            </div>
                        ))}
                    </ReactSortable>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} variant="outline">Cancelar</Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
