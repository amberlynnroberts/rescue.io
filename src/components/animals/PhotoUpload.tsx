import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Upload, X, Star, Loader } from 'lucide-react'
import clsx from 'clsx'

interface PhotoUploadProps {
  animalId: string
  onUploaded?: () => void
  compact?: boolean
}

export function PhotoUpload({ animalId, onUploaded, compact = false }: PhotoUploadProps) {
  const { org, user } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setUploading(true)
    setError('')

    for (const file of arr) {
      const ext = file.name.split('.').pop()
      const path = `${org!.id}/${animalId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('animal-photos')
        .upload(path, file, { contentType: file.type })

      if (uploadError) { setError(uploadError.message); continue }

      const { data: { publicUrl } } = supabase.storage
        .from('animal-photos')
        .getPublicUrl(path)

      // Check if this is the first photo (make it primary)
      const { count } = await supabase
        .from('animal_photos')
        .select('*', { count: 'exact', head: true })
        .eq('animal_id', animalId)

      await supabase.from('animal_photos').insert({
        org_id: org!.id,
        animal_id: animalId,
        url: publicUrl,
        is_primary: count === 0,
        uploaded_by: user?.id,
      })
    }

    setUploading(false)
    onUploaded?.()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    uploadFiles(e.dataTransfer.files)
  }

  if (compact) {
    return (
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="btn-secondary text-xs px-2 py-1"
      >
        {uploading ? <Loader size={12} className="animate-spin" /> : <Upload size={12} />}
        {uploading ? 'Uploading…' : 'Add photo'}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && uploadFiles(e.target.files)} />
      </button>
    )
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !uploading && fileRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          dragging ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-400 hover:bg-gray-50',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader size={24} className="text-teal-400 animate-spin" />
            <p className="text-sm text-gray-500">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-700">Drop photos here or click to browse</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — multiple OK</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => e.target.files && uploadFiles(e.target.files)} />
    </div>
  )
}

interface PhotoGalleryProps {
  photos: { id: string; url: string; is_primary: boolean }[]
  onSetPrimary?: (id: string) => void
  onDelete?: (id: string) => void
}

export function PhotoGallery({ photos, onSetPrimary, onDelete }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<string | null>(null)

  if (!photos.length) return null

  const selectedPhoto = photos.find(p => p.id === selected) ?? photos[0]

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden">
        <img
          src={selectedPhoto.url}
          alt=""
          className="w-full h-full object-cover"
        />
        {selectedPhoto.is_primary && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            <Star size={10} fill="currentColor" /> Primary
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {onSetPrimary && !selectedPhoto.is_primary && (
            <button
              onClick={() => onSetPrimary(selectedPhoto.id)}
              className="bg-black/50 text-white text-xs px-2 py-1 rounded-full hover:bg-black/70 transition-colors"
            >
              Set primary
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(selectedPhoto.id)}
              className="bg-black/50 text-white p-1 rounded-full hover:bg-red-500/80 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={clsx(
                'w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                (selected === p.id || (!selected && p.is_primary))
                  ? 'border-teal-400' : 'border-transparent hover:border-gray-300'
              )}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
