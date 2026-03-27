'use client';

import { useState, useRef } from 'react';
import { X, Upload, Link2, Check, AlertCircle, ImagePlus, Loader2 } from 'lucide-react';
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
import { uploadImage } from '@/lib/cloudinary';

interface MovieFormProps {
  movie?: Movie | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function MovieForm({ movie, onSubmit, onCancel, isEditing }: MovieFormProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState(movie?.thumbnail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  // Manejar selección de archivo desde dispositivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no puede superar los 5MB');
      return;
    }

    setIsUploadingThumbnail(true);
    setUploadError(null);

    try {
      // Subir a Cloudinary
      const uploadedUrl = await uploadImage(file);
      setThumbnailUrl(uploadedUrl);
      console.log('✅ Imagen subida exitosamente:', uploadedUrl);
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen. Intenta con otra imagen o usa una URL.';
      setUploadError(errorMessage);
    } finally {
      setIsUploadingThumbnail(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Abrir selector de archivos
  const openFilePicker = () => {
    fileInputRef.current?.click();
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
            Enlace de Video (Google Drive / URL directa)
          </Label>
          <Input
            id="videoUrl"
            name="videoUrl"
            type="url"
            defaultValue={movie?.videoUrl || ''}
            placeholder="https://drive.google.com/file/d/... o URL directa"
            className="bg-[#1a1a1a] border-white/20 focus:border-[#E50914] text-white"
          />
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-[#4285f4] rounded-full"></span>
              Google Drive (se reproducirá en iframe)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              URL directa de video (MP4, WEBM)
            </span>
          </div>
        </div>

        {/* Telegram MTProto - Para videos de Telegram */}
        <div className="space-y-2 md:col-span-2 p-4 bg-[#0088cc]/10 border border-[#0088cc]/30 rounded-lg">
          <Label className="text-[#0088cc] text-xs uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
            </svg>
            Telegram MTProto (Sin límite de tamaño)
          </Label>
          <p className="text-white/50 text-xs mb-3">
            Para videos de Telegram, ingresa el canal y ID del mensaje. Se usará MTProto para descargar sin límite de tamaño.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="channelUsername" className="text-white/60 text-xs">
                Canal (sin @)
              </Label>
              <Input
                id="channelUsername"
                name="channelUsername"
                type="text"
                defaultValue={movie?.channelUsername || ''}
                placeholder="VertiflixVideos"
                className="bg-[#1a1a1a] border-white/20 focus:border-[#0088cc] text-white"
              />
            </div>
            <div>
              <Label htmlFor="channelMessageId" className="text-white/60 text-xs">
                ID del Mensaje
              </Label>
              <Input
                id="channelMessageId"
                name="channelMessageId"
                type="number"
                defaultValue={movie?.channelMessageId || ''}
                placeholder="123"
                className="bg-[#1a1a1a] border-white/20 focus:border-[#0088cc] text-white"
              />
            </div>
          </div>
          <p className="text-white/30 text-xs mt-2">
            Ejemplo: Canal = VertiflixVideos, ID = 22 (del link t.me/VertiflixVideos/22)
          </p>
        </div>

        {/* Thumbnail */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="thumbnail" className="text-white/80 text-xs uppercase tracking-wider">
            URL del Thumbnail / Portada *
          </Label>
          
          {/* Input oculto para seleccionar archivo desde galería */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
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
            <Button
              type="button"
              variant="outline"
              onClick={openFilePicker}
              disabled={isUploadingThumbnail}
              className="border-white/20 hover:bg-white/10 shrink-0"
              title="Subir desde dispositivo"
            >
              {isUploadingThumbnail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {/* Error de subida */}
          {uploadError && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {uploadError}
            </p>
          )}
          
          {/* Preview de imagen */}
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
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-white/40">
            <span>• Usa una URL directa a una imagen (JPG, PNG, WEBP)</span>
            <span>• O sube desde tu dispositivo (máx 5MB)</span>
          </div>
          <p className="text-xs text-white/30">Recomendado: 400×600 px</p>
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
