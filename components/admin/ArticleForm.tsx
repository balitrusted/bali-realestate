"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { ParagraphWithClass } from "@/lib/tiptap/paragraphWithClass";
import { Article } from "@/types/article";

interface ArticleFormProps {
  article?: Article;
  onSave: (article: any) => void;
}

const categories = [
  { value: "ubud", label: "Ubud" },
  { value: "rent", label: "Long-term rental" },
  { value: "buy", label: "Purchase and Investments" },
  { value: "land", label: "Land" },
  { value: "legal", label: "Legal and Safety" },
  { value: "areas", label: "Areas" },
  { value: "risks", label: "Mistakes and Reality" },
];

export default function ArticleForm({ article, onSave }: ArticleFormProps) {
  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    category: article?.category || "ubud",
    content: article?.content || "",
    excerpt: article?.excerpt || "",
    featuredImage: article?.featuredImage || "",
    tags: article?.tags?.join(", ") || "",
    author: article?.author || "Admin",
    published: article?.published || false,
    seoTitle: article?.seoTitle || "",
    seoDescription: article?.seoDescription || "",
    seoKeywords: article?.seoKeywords?.join(", ") || "",
    allowComments: article?.allowComments !== false,
  });

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'heading',
          },
        },
      }),
      ParagraphWithClass,
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'article-link',
        },
        validate: (url) => {
          // External URLs, anchors, and site-relative paths (e.g. /properties/rent/ubud)
          return /^(https?:\/\/|#|\/)/.test(url);
        },
      }),
    ],
    content: formData.content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData({ ...formData, content: editor.getHTML() });
    },
  });

  // Update editor content when article changes
  useEffect(() => {
    if (editor && article?.content) {
      editor.commands.setContent(article.content);
    }
  }, [editor, article]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!article && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, article]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const articleData = {
      ...formData,
      id: article?.id,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
      seoKeywords: formData.seoKeywords.split(",").map(k => k.trim()).filter(Boolean),
    };
    
    onSave(articleData);
  };

  const addImage = () => {
    setShowImageModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const text = await response.text();
      let data: { url?: string; error?: string } = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(response.ok ? "Invalid server response" : `Upload failed (${response.status})`);
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `Upload failed (${response.status})`);
      }

      if (!data.url) {
        throw new Error("Server did not return image URL");
      }
      
      // Insert image into editor (data.url is the full Blob URL or /uploads/ path)
      editor?.chain().focus().setImage({ src: data.url }).run();
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleImageSubmit = () => {
    if (imageUrl.trim()) {
      editor?.chain().focus().setImage({ src: imageUrl.trim() }).run();
      setImageUrl("");
      setShowImageModal(false);
    }
  };

  const addLink = () => {
    setShowLinkModal(true);
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      const url = linkUrl.trim();
      // If it starts with #, it's an anchor link
      if (url.startsWith("#")) {
        editor?.chain().focus().setLink({ href: url }).run();
      } else if (url.startsWith("/")) {
        editor?.chain().focus().setLink({ href: url }).run();
      } else if (url.startsWith("http://") || url.startsWith("https://")) {
        editor?.chain().focus().setLink({ href: url }).run();
      } else {
        editor?.chain().focus().setLink({ href: `https://${url}` }).run();
      }
      setLinkUrl("");
      setShowLinkModal(false);
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            URL *
          </label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            placeholder="article-url-slug"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Author
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Short description
          </label>
          <textarea
            rows={3}
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            placeholder="Brief description of the article..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Featured Image URL
          </label>
          <input
            type="url"
            value={formData.featuredImage}
            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            placeholder="ubud, areas, rental"
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Content</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Article Content *
          </label>
          
          {/* Toolbar - Sticky */}
          <div className="sticky top-0 z-10 border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-2 shadow-sm">
            {/* Undo/Redo */}
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={`px-3 py-1 text-sm rounded ${
                editor.can().undo() ? "bg-white text-gray-700 hover:bg-gray-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Undo (Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={`px-3 py-1 text-sm rounded ${
                editor.can().redo() ? "bg-white text-gray-700 hover:bg-gray-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Redo (Ctrl+Y)"
            >
              ↷ Redo
            </button>
            <div className="w-px bg-gray-300"></div>
            
            {/* Text Formatting */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive("bold") ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive("italic") ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive("underline") ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <u>U</u>
            </button>
            <div className="w-px bg-gray-300"></div>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive("heading", { level: 1 }) ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive("heading", { level: 2 }) ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive("heading", { level: 3 }) ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              H3
            </button>
            <div className="w-px bg-gray-300"></div>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive("bulletList") ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1 text-sm rounded ${
                editor.isActive("orderedList") ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              1. List
            </button>
            <div className="w-px bg-gray-300"></div>
            <button
              type="button"
              onClick={addLink}
              className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100"
              title="Add link (URL or anchor like #section-id)"
            >
              Link
            </button>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100 cursor-pointer inline-block ${
                  uploadingImage ? "opacity-50" : ""
                }`}
              >
                {uploadingImage ? "Uploading..." : "Upload Image"}
              </label>
            </div>
            <button
              type="button"
              onClick={addImage}
              className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100"
              title="Add image from URL"
            >
              Image URL
            </button>
            <button
              type="button"
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent(
                    '<p class="article-image-caption">Jalan Subak Sok Wayah, Bali, Indonesia · 12 February 2025 · Photo by Kadek K.</p>'
                  )
                  .run()
              }
              className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100"
              title="Insert a small credit line under an image (edit the placeholder text)"
            >
              Caption
            </button>
            <div className="w-px bg-gray-300"></div>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
          
          {/* Editor */}
          <div className="border border-t-0 border-gray-300 rounded-b-md min-h-[500px] bg-white">
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <p className="text-xs text-gray-500">Editor Preview - Formatting is visible as you type</p>
            </div>
            <div className="p-6">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">SEO Settings</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            SEO Title (leave empty to use article title)
          </label>
          <input
            type="text"
            value={formData.seoTitle}
            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            SEO Description
          </label>
          <textarea
            rows={3}
            value={formData.seoDescription}
            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            placeholder="Meta description for search engines..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            SEO Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={formData.seoKeywords}
            onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            placeholder="bali, ubud, villa rental"
          />
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="ml-2 text-sm text-gray-700">Published</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.allowComments}
              onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="ml-2 text-sm text-gray-700">Allow Comments</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          {article ? "Update Article" : "Create Article"}
        </button>
      </div>
    </form>

    {/* Image Modal */}
    {showImageModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Image</h3>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 mb-4"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleImageSubmit();
              }
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImageSubmit}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              Add Image
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImageModal(false);
                setImageUrl("");
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Link Modal */}
    {showLinkModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Link</h3>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL or anchor link (e.g., #section-id)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 mb-2"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleLinkSubmit();
              }
            }}
          />
          <p className="text-xs text-gray-500 mb-4">
            Use <code className="text-xs">https://…</code>, a site path like{" "}
            <code className="text-xs">/properties/rent/ubud</code>, or an anchor <code className="text-xs">#section-id</code>.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLinkSubmit}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              Add Link
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkModal(false);
                setLinkUrl("");
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
