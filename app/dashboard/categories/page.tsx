"use client";

import React from "react";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/services/categories";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Category } from "@/types/domain/products";
import { MdAdd, MdDelete, MdEdit, MdSave } from "react-icons/md";

interface CategoryFormState {
  name: string;
  slug: string;
}

const initialForm: CategoryFormState = {
  name: "",
  slug: "",
};

const slugify = (value: string): string =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function DashboardCategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [form, setForm] = React.useState<CategoryFormState>(initialForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingForm, setEditingForm] =
    React.useState<CategoryFormState>(initialForm);
  const [isLoading, setIsLoading] = React.useState(true);
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
    void loadCategories();
  }, [loadCategories]);

  const handleNameChange = (value: string) => {
    setForm((current) => ({
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

    try {
      const created = await createCategory({ name, slug });
      setCategories((current) => [...current, created]);
      setForm(initialForm);
    } catch (createError) {
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
    });
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

    try {
      const updated = await updateCategory(id, { name, slug });
      setCategories((current) =>
        current.map((category) => (category.id === id ? updated : category)),
      );
      setEditingId(null);
      setEditingForm(initialForm);
    } catch (updateError) {
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

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
  };

  return (
    <section className="space-y-6">
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

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>
          <p className="mt-1 text-sm text-slate-600">
            Administra las categorias disponibles para crear y editar productos.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <label className="block text-sm font-medium text-slate-700">
          Nombre
          <input
            value={form.name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Ej. Ropa bebé"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
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
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
          />
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 md:self-end"
        >
          <MdAdd size={18} />
          {isSaving ? "Creando..." : "Crear"}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">
            Cargando categorias...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
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
                      <input
                        value={editingForm.name}
                        onChange={(event) =>
                          setEditingForm((current) => ({
                            ...current,
                            name: event.target.value,
                            slug: current.slug || slugify(event.target.value),
                          }))
                        }
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                      <input
                        value={editingForm.slug}
                        onChange={(event) =>
                          setEditingForm((current) => ({
                            ...current,
                            slug: slugify(event.target.value),
                          }))
                        }
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
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
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900">
                          {category.name}
                        </h2>
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
                          onClick={() => void handleDelete(category)}
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

      <p className="text-xs text-slate-500">
        Las categorias cuyo slug contiene <code>ropa</code> activan genero y
        variantes por talla en los formularios de producto.
      </p>
    </section>
  );
}
