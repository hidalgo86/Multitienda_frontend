"use client";

import React from "react";
import {
  MdAdd,
  MdCameraAlt,
  MdClose,
  MdDelete,
  MdEdit,
  MdPhotoLibrary,
  MdSave,
} from "react-icons/md";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  createCategory,
  deleteCategoryImage,
  deleteCategory,
  listCategories,
  updateCategory,
  uploadCategoryImage,
} from "@/services/categories";
import type { Category } from "@/types/domain/products";

interface CategoriesManagerModalProps {
  open: boolean;
  onClose: () => void;
}

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imagePublicId: string | null;
  isFeatured: boolean;
  displayOrder: string;
}

const initialForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  imagePublicId: null,
  isFeatured: false,
  displayOrder: "0",
};

const slugify = (value: string): string =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function CategoriesManagerModal({
  open,
  onClose,
}: CategoriesManagerModalProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [form, setForm] = React.useState<CategoryFormState>(initialForm);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingForm, setEditingForm] =
    React.useState<CategoryFormState>(initialForm);
  const [editingImageFile, setEditingImageFile] = React.useState<File | null>(
    null,
  );
  const [editingImagePreviewUrl, setEditingImagePreviewUrl] =
    React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    React.useState<Category | null>(null);

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setCategories(await listCategories());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las categorias",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      void loadCategories();
    }
  }, [loadCategories, open]);

  React.useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setImageFile(null);
      setImagePreviewUrl("");
      setEditingId(null);
      setEditingForm(initialForm);
      setEditingImageFile(null);
      setEditingImagePreviewUrl("");
      setError(null);
      setCategoryToDelete(null);
    }
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  React.useEffect(() => {
    return () => {
      if (editingImagePreviewUrl) URL.revokeObjectURL(editingImagePreviewUrl);
    };
  }, [editingImagePreviewUrl]);

  const selectImageFile = (
    file: File | undefined,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreviewUrl: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (!file) return;

    setFile(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  };

  const removeNewImageSelection = () => {
    setImageFile(null);
    setImagePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  };

  const removeEditingImageSelection = () => {
    setEditingImageFile(null);
    setEditingImagePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return "";
    });
  };

  const handleNameChange = (value: string) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: current.slug || slugify(value),
    }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    const slug = slugify(form.slug || form.name);

    if (!name || !slug) {
      setError("Indica nombre y slug para crear la categoria");
      return;
    }

    setIsSaving(true);
    let uploadedImage: { url: string; publicId: string } | null = null;

    try {
      if (imageFile) {
        uploadedImage = await uploadCategoryImage(imageFile);
      }

      const created = await createCategory({
        name,
        slug,
        description: form.description.trim(),
        imageUrl: uploadedImage?.url ?? form.imageUrl.trim(),
        imagePublicId: uploadedImage?.publicId ?? form.imagePublicId,
        isFeatured: form.isFeatured,
        displayOrder: Math.max(0, Math.trunc(Number(form.displayOrder) || 0)),
      });
      setCategories((current) => [...current, created]);
      setForm(initialForm);
      removeNewImageSelection();
    } catch (createError) {
      if (uploadedImage?.publicId) {
        await deleteCategoryImage(uploadedImage.publicId).catch(() => undefined);
      }
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear la categoria",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      imagePublicId: category.imagePublicId ?? null,
      isFeatured: category.isFeatured === true,
      displayOrder: String(category.displayOrder ?? 0),
    });
    removeEditingImageSelection();
    setError(null);
  };

  const handleUpdate = async (id: string) => {
    setError(null);

    const name = editingForm.name.trim();
    const slug = slugify(editingForm.slug || editingForm.name);

    if (!name || !slug) {
      setError("Indica nombre y slug para actualizar la categoria");
      return;
    }

    setBusyId(id);
    let uploadedImage: { url: string; publicId: string } | null = null;
    const previousCategory = categories.find((category) => category.id === id);
    const previousPublicId = previousCategory?.imagePublicId ?? null;

    try {
      if (editingImageFile) {
        uploadedImage = await uploadCategoryImage(editingImageFile);
      }

      const updated = await updateCategory(id, {
        name,
        slug,
        description: editingForm.description.trim(),
        imageUrl: uploadedImage?.url ?? editingForm.imageUrl.trim(),
        imagePublicId:
          uploadedImage?.publicId ?? editingForm.imagePublicId ?? null,
        isFeatured: editingForm.isFeatured,
        displayOrder: Math.max(
          0,
          Math.trunc(Number(editingForm.displayOrder) || 0),
        ),
      });
      setCategories((current) =>
        current.map((category) => (category.id === id ? updated : category)),
      );
      setEditingId(null);
      setEditingForm(initialForm);
      removeEditingImageSelection();

      if (
        uploadedImage?.publicId &&
        previousPublicId &&
        previousPublicId !== uploadedImage.publicId
      ) {
        await deleteCategoryImage(previousPublicId).catch(() => undefined);
      }
    } catch (updateError) {
      if (uploadedImage?.publicId) {
        await deleteCategoryImage(uploadedImage.publicId).catch(() => undefined);
      }
      setError(
        updateError instanceof Error
          ? updateError.message
          : "No se pudo actualizar la categoria",
      );
    } finally {
      setBusyId(null);
    }
  };

  const deleteSelectedCategory = async (category: Category) => {
    setBusyId(category.id);
    setError(null);

    try {
      await deleteCategory(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      if (category.imagePublicId) {
        await deleteCategoryImage(category.imagePublicId).catch(() => undefined);
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar la categoria",
      );
    } finally {
      setBusyId(null);
      setCategoryToDelete(null);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="categories-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-5"
    >
      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Eliminar categoria"
        description="Si esta categoria tiene productos asociados, el backend puede rechazar la accion."
        details={categoryToDelete?.name}
        confirmLabel="Eliminar categoria"
        busyLabel="Eliminando..."
        tone="danger"
        isBusy={Boolean(categoryToDelete && busyId === categoryToDelete.id)}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            void deleteSelectedCategory(categoryToDelete);
          }
        }}
      />

      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="categories-modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              Categorias de productos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Administra las categorias disponibles para crear y editar productos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Cerrar categorias"
            title="Cerrar"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {error ? (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form
            onSubmit={handleCreate}
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_auto]"
          >
            <label className="block text-sm font-medium text-slate-700">
              Nombre
              <input
                value={form.name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="Ej. Ropa bebe"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Slug
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    slug: slugify(event.target.value),
                  }))
                }
                placeholder="ropa-bebe"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Orden
              <input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    displayOrder: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isFeatured: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-slate-900"
              />
              Destacada
            </label>
            <label className="block text-sm font-medium text-slate-700 md:col-span-2">
              Descripcion
              <input
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Texto corto para mostrar en home"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
            <div className="space-y-2 lg:col-span-2">
              <span className="block text-sm font-medium text-slate-700">
                Imagen
              </span>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {imagePreviewUrl || form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreviewUrl || form.imageUrl}
                      alt="Vista previa de categoria"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Sin imagen
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white">
                    <MdPhotoLibrary size={16} />
                    Galeria
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        selectImageFile(
                          event.target.files?.[0],
                          setImageFile,
                          setImagePreviewUrl,
                        );
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white">
                    <MdCameraAlt size={16} />
                    Camara
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={(event) => {
                        selectImageFile(
                          event.target.files?.[0],
                          setImageFile,
                          setImagePreviewUrl,
                        );
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {imagePreviewUrl ? (
                    <button
                      type="button"
                      onClick={removeNewImageSelection}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 md:self-end lg:col-start-4"
            >
              <MdAdd size={18} />
              {isSaving ? "Creando..." : "Agregar"}
            </button>
          </form>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Cargando categorias...
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Aun no hay categorias.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map((category) => {
                  const isEditing = editingId === category.id;
                  const isBusy = busyId === category.id;

                  return (
                    <article
                      key={category.id}
                      className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      {isEditing ? (
                        <>
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_100px_120px]">
                            <input
                              value={editingForm.name}
                              onChange={(event) =>
                                setEditingForm((current) => ({
                                  ...current,
                                  name: event.target.value,
                                  slug:
                                    current.slug || slugify(event.target.value),
                                }))
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                            <input
                              value={editingForm.slug}
                              onChange={(event) =>
                                setEditingForm((current) => ({
                                  ...current,
                                  slug: slugify(event.target.value),
                                }))
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editingForm.displayOrder}
                              onChange={(event) =>
                                setEditingForm((current) => ({
                                  ...current,
                                  displayOrder: event.target.value,
                                }))
                              }
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={editingForm.isFeatured}
                                onChange={(event) =>
                                  setEditingForm((current) => ({
                                    ...current,
                                    isFeatured: event.target.checked,
                                  }))
                                }
                                className="h-4 w-4 accent-slate-900"
                              />
                              Destacada
                            </label>
                            <input
                              value={editingForm.description}
                              onChange={(event) =>
                                setEditingForm((current) => ({
                                  ...current,
                                  description: event.target.value,
                                }))
                              }
                              placeholder="Descripcion"
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400 md:col-span-2"
                            />
                            <div className="space-y-2 md:col-span-2">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                  {editingImagePreviewUrl ||
                                  editingForm.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={
                                        editingImagePreviewUrl ||
                                        editingForm.imageUrl
                                      }
                                      alt="Vista previa de categoria"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                      Sin imagen
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                                    <MdPhotoLibrary size={16} />
                                    Galeria
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="sr-only"
                                      onChange={(event) => {
                                        selectImageFile(
                                          event.target.files?.[0],
                                          setEditingImageFile,
                                          setEditingImagePreviewUrl,
                                        );
                                        event.target.value = "";
                                      }}
                                    />
                                  </label>
                                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                                    <MdCameraAlt size={16} />
                                    Camara
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="sr-only"
                                      onChange={(event) => {
                                        selectImageFile(
                                          event.target.files?.[0],
                                          setEditingImageFile,
                                          setEditingImagePreviewUrl,
                                        );
                                        event.target.value = "";
                                      }}
                                    />
                                  </label>
                                  {editingImagePreviewUrl ? (
                                    <button
                                      type="button"
                                      onClick={removeEditingImageSelection}
                                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                      Quitar
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleUpdate(category.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                            >
                              <MdSave size={16} />
                              Guardar
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                            >
                              Cancelar
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex min-w-0 gap-3">
                            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                              {category.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={category.imageUrl}
                                  alt={category.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                                  Sin imagen
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {category.name}
                            </h3>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {category.slug}
                              {category.isFeatured ? " · destacada" : ""}
                              {category.displayOrder
                                ? ` · orden ${category.displayOrder}`
                                : ""}
                            </p>
                            {category.description ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {category.description}
                              </p>
                            ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => startEdit(category)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                            >
                              <MdEdit size={16} />
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setCategoryToDelete(category)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                            >
                              <MdDelete size={16} />
                              Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Las categorias cuyo slug contiene <code>ropa</code> activan genero y
            variantes por talla en los formularios de producto.
          </p>
        </div>
      </div>
    </div>
  );
}
