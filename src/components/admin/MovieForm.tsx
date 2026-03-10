'use client';

import { useState } from 'react';
import { X, Upload, Link2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Movie, CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';

interface MovieFormProps {
  movie?: Movie | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function MovieForm({ movie, onSubmit, onCancel, isEditing }: MovieFormProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState(movie?.thumbnail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Edit Banner */}
      {isEditing && (
        <div className="flex items-center gap-3 bg-[#E50914]/10 border border-[#E50914]/30 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-[#E50914]" />
          <span className="text-sm">
            Editando: <strong>{movie?.title}</strong>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="ml-auto border-white/20 hover:bg-white/10"
          >
            Cancelar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Title */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title" className="text-white/80 text-xs uppercase tracking-wider">
            Título *
          </Label>
          <Input
            id="title"
            name="title"
            defaultValue={movie?.title || ''}
            placeholder="Ej: Avengers: Endgame"
            required
            className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white"
          />
        </div>

        {/* Video URL */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="videoUrl" className="text-white/80 text-xs uppercase tracking-wider">
            Enlace de Google Drive *
          </Label>
          <Input
            id="videoUrl"
            name="videoUrl"
            type="url"
            defaultValue={movie?.videoUrl || ''}
            placeholder="https://drive.google.com/file/d/..."
            required
            className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white"
          />
          <p className="text-xs text-white/40">
            Pega el enlace de compartir de Google Drive
          </p>
        </div>

        {/* Thumbnail */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="thumbnail" className="text-white/80 text-xs uppercase tracking-wider">
            URL del Thumbnail / Portada *
          </Label>
          <div className="flex gap-3">
            <Input
              id="thumbnail"
              name="thumbnail"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
              required
              className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white flex-1"
            />
          </div>
          {thumbnailUrl && (
            <div className="mt-3">
              <img
                src={thumbnailUrl}
                alt="Preview"
                className="w-32 h-48 object-cover rounded-lg border border-white/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <p className="text-xs text-white/40">
            Usa una URL directa a una imagen (JPG, PNG, WEBP). Recomendado: 400×600 px
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-white/80 text-xs uppercase tracking-wider">
            Categoría *
          </Label>
          <Select name="category" defaultValue={movie?.category || ''} required>
            <SelectTrigger className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/20 text-white">
              {CATEGORIES.filter((c) => c.id !== 'todas').map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="hover:bg-white/10">
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="year" className="text-white/80 text-xs uppercase tracking-wider">
            Año *
          </Label>
          <Input
            id="year"
            name="year"
            type="number"
            min={1900}
            max={2030}
            defaultValue={movie?.year || new Date().getFullYear()}
            required
            className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="text-white/80 text-xs uppercase tracking-wider">
            Duración (minutos) *
          </Label>
          <Input
            id="duration"
            name="duration"
            type="number"
            min={1}
            defaultValue={movie?.duration || 120}
            required
            className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white"
          />
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <Label htmlFor="rating" className="text-white/80 text-xs uppercase tracking-wider">
            Calificación (0-10)
          </Label>
          <Input
            id="rating"
            name="rating"
            type="number"
            min={0}
            max={10}
            step={0.1}
            defaultValue={movie?.rating || 0}
            className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white"
          />
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language" className="text-white/80 text-xs uppercase tracking-wider">
            Idioma
          </Label>
          <Select name="language" defaultValue={movie?.language || 'Español'}>
            <SelectTrigger className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/20 text-white">
              <SelectItem value="Español">Español</SelectItem>
              <SelectItem value="Inglés">Inglés</SelectItem>
              <SelectItem value="Subtitulado">Subtitulado</SelectItem>
              <SelectItem value="Doblado">Doblado</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured */}
        <div className="space-y-2">
          <Label htmlFor="featured" className="text-white/80 text-xs uppercase tracking-wider">
            Destacado
          </Label>
          <Select name="featured" defaultValue={movie?.featured ? 'true' : 'false'}>
            <SelectTrigger className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/20 text-white">
              <SelectItem value="false">No</SelectItem>
              <SelectItem value="true">Sí</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description" className="text-white/80 text-xs uppercase tracking-wider">
            Descripción *
          </Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={movie?.description || ''}
            placeholder="Describe la sinopsis de la película..."
            required
            rows={4}
            className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-white/20 hover:bg-white/10"
        >
          Limpiar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#E50914] hover:bg-[#b00710] text-white min-w-[140px]"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </span>
          ) : isEditing ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Guardar Cambios
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Agregar Película
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
