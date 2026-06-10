import React, { useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import QuickMediaDrawer from '@/components/quick-media-drawer';
import { 
    Bold, Italic, Strikethrough, 
    Heading1, Heading2, Heading3, 
    List, ListOrdered, Quote, 
    Code, Undo, Redo, Image as ImageIcon
} from 'lucide-react';

interface TiptapProps {
  value: string;
  onChange: (value: string) => void;
}

interface MenuBarProps {
  editor: Editor | null;
  onOpenMedia: () => void;
}

const MenuBar = ({ editor, onOpenMedia }: MenuBarProps) => {
  if (!editor) {
    return null;
  }

  const menuItems = [
    {
      icon: Bold,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleBold().run(), 50);
      },
      isActive: editor.isActive('bold'),
    },
    {
      icon: Italic,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleItalic().run(), 50);
      },
      isActive: editor.isActive('italic'),
    },
    {
      icon: Strikethrough,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleStrike().run(), 50);
      },
      isActive: editor.isActive('strike'),
    },
    {
      icon: Heading1,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleHeading({ level: 1 }).run(), 50);
      },
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: Heading2,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleHeading({ level: 2 }).run(), 50);
      },
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: Heading3,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleHeading({ level: 3 }).run(), 50);
      },
      isActive: editor.isActive('heading', { level: 3 }),
    },
    {
      icon: List,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleBulletList().run(), 50);
      },
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: ListOrdered,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleOrderedList().run(), 50);
      },
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: Quote,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleBlockquote().run(), 50);
      },
      isActive: editor.isActive('blockquote'),
    },
    {
      icon: Code,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().toggleCodeBlock().run(), 50);
      },
      isActive: editor.isActive('codeBlock'),
    },
    {
      icon: ImageIcon,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        onOpenMedia();
      },
      isActive: editor.isActive('image'),
    },
    {
      icon: Undo,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().undo().run(), 50);
      },
      isActive: false,
    },
    {
      icon: Redo,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => { 
        e.preventDefault(); 
        editor.commands.focus(); 
        setTimeout(() => editor.chain().redo().run(), 50);
      },
      isActive: false,
    },
  ];

  return (
    <div className="border border-input bg-transparent rounded-t-md p-2 flex items-center flex-wrap gap-1">
      {menuItems.map((item, index) => (
        <button
          key={index}
          type="button"
          onClick={item.onClick}
          className={`p-2 rounded-md ${item.isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
        >
          <item.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

const Tiptap: React.FC<TiptapProps> = ({ value, onChange }) => {
  const [mediaOpen, setMediaOpen] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, ImageExtension],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: true,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 border border-input rounded-b-md min-h-[300px] focus:outline-none',
      },
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleSelectImage = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setMediaOpen(false);
  };

  return (
    <div>
      <MenuBar editor={editor} onOpenMedia={() => setMediaOpen(true)} />
      <EditorContent editor={editor} />
      <QuickMediaDrawer
        isOpen={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleSelectImage}
        initialType="Images"
      />
    </div>
  );
};

export default Tiptap;
