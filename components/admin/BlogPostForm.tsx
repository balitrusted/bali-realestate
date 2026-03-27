"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { ParagraphWithClass } from "@/lib/tiptap/paragraphWithClass";
import type { BlogPost } from "@/types/blog";

interface BlogPostFormProps {
  post?: BlogPost;
  onSave: (payload: Record<string, unknown>) => void;
}

const locations: { value: BlogPost["location"]; label: string }[] = [
  { value: "ubud", label: "Ubud" },
  { value: "sanur", label: "Sanur" },
  { value: "other", label: "Other" },
];

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BlogPostForm({ post, onSave }: BlogPostFormProps) {
  const [formData, setFormData] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    location: post?.location ?? "ubud",
    content: post?.content ?? "",
    summary: post?.summary ?? "",
    featuredImage: post?.featuredImage ?? "",
    tags: post?.tags?.join(", ") ?? "",
    author: post?.author ?? "Balitrusted Team",
    published: post?.published ?? true,
    publishedAtLocal: post?.publishedAt ? toDatetimeLocalValue(post.publishedAt) : "",
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
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
            class: "heading",
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
          class: "article-link",
        },
        validate: (url) => /^(https?:\/\/|#|\/)/.test(url),
      }),
    ],
    content: formData.content,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      setFormData((prev) => ({ ...prev, content: ed.getHTML() }));
    },
  });

  useEffect(() => {
    if (editor && post?.content) {
      editor.commands.setContent(post.content);
    }
  }, [editor, post]);

  useEffect(() => {
    if (!post && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, post]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const publishedAtIso =
      formData.publishedAtLocal && formData.publishedAtLocal.length >= 10
        ? new Date(formData.publishedAtLocal).toISOString()
        : post?.publishedAt || new Date().toISOString();

    onSave({
      ...(post ? { id: post.id, createdAt: post.createdAt } : {}),
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      summary: formData.summary.trim(),
      content: formData.content,
      location: formData.location,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      author: formData.author.trim(),
      published: formData.published,
      publishedAt: publishedAtIso,
      seoTitle: formData.seoTitle.trim() || undefined,
      seoDescription: formData.seoDescription.trim() || undefined,
      featuredImage: formData.featuredImage.trim() || undefined,
    });
  };

  const addImage = () => setShowImageModal(true);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
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
      editor?.chain().focus().setImage({ src: data.url }).run();
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
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

  const addLink = () => setShowLinkModal(true);

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      const url = linkUrl.trim();
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">URL slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              placeholder="post-url-slug"
            />
            <p className="text-xs text-gray-500 mt-1">Public URL: /blog/{formData.slug || "…"}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Location tag *</label>
              <select
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value as BlogPost["location"] })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              >
                {locations.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Summary</label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              placeholder="Short intro shown on the blog hub…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Featured image URL</label>
            <input
              type="url"
              value={formData.featuredImage}
              onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Content</h2>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Post body *</label>
            <div className="sticky top-0 z-10 border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-2 shadow-sm">
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
              <div className="w-px bg-gray-300" />
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
              <div className="w-px bg-gray-300" />
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-3 py-1 text-sm rounded ${
                  editor.isActive("heading", { level: 1 })
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-3 py-1 text-sm rounded ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-3 py-1 text-sm rounded ${
                  editor.isActive("heading", { level: 3 })
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                H3
              </button>
              <div className="w-px bg-gray-300" />
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
              <div className="w-px bg-gray-300" />
              <button
                type="button"
                onClick={addLink}
                className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100"
                title="URL, /path, or #anchor"
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
                  id="blog-editor-image-upload"
                />
                <label
                  htmlFor="blog-editor-image-upload"
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
                title="Insert photo credit line (edit after inserting); place just below the image"
              >
                Caption
              </button>
              <div className="w-px bg-gray-300" />
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                className="px-3 py-1 text-sm rounded bg-white text-gray-700 hover:bg-gray-100"
              >
                Clear
              </button>
            </div>
            <div className="border border-t-0 border-gray-300 rounded-b-md min-h-[500px] bg-white">
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <p className="text-xs text-gray-500">Editor preview — same tools as Knowledge Base Articles</p>
              </div>
              <div className="p-6">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">SEO</h2>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">SEO title (optional)</label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">SEO description (optional)</label>
            <textarea
              rows={3}
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Published date (local)</label>
              <input
                type="datetime-local"
                value={formData.publishedAtLocal}
                onChange={(e) => setFormData({ ...formData, publishedAtLocal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-700">Published (visible on /blog)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button type="submit" className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
            {post ? "Update post" : "Create post"}
          </button>
        </div>
      </form>

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
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImageSubmit();
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

      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Link</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://… , /properties/rent/ubud, or #section"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 mb-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLinkSubmit();
              }}
            />
            <p className="text-xs text-gray-500 mb-4">Use a leading slash for internal pages (same site).</p>
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
