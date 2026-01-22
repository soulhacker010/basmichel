import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

export default function AddEditorNote({ projectId }) {
  const [noteText, setNoteText] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: editors = [] } = useQuery({
    queryKey: ['editors'],
    queryFn: () => base44.entities.Editor.list(),
    enabled: !!currentUser,
  });

  const currentEditor = editors.find(e => e.user_id === currentUser?.id && e.status === 'active');

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.EditorNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorNotes'] });
      setNoteText('');
      setImageFiles([]);
      toast.success('Notitie toegevoegd');
    },
  });

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error('Voer een notitie in');
      return;
    }

    if (!currentEditor && currentUser?.role !== 'admin') {
      toast.error('Editor profiel niet gevonden');
      return;
    }

    setUploading(true);
    
    try {
      const uploadedImages = [];
      for (const file of imageFiles) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedImages.push(file_url);
      }

      await createNoteMutation.mutateAsync({
        project_id: projectId,
        editor_id: currentEditor?.id || 'admin',
        note: noteText,
        images: uploadedImages,
      });
    } catch (error) {
      toast.error('Fout bij toevoegen notitie');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl p-6 mt-6">
      <h3 className="text-base font-medium text-gray-900 mb-4">Notitie toevoegen</h3>
      <div className="space-y-3">
        <Textarea
          placeholder="Voeg een notitie toe over dit project..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={4}
          className="w-full"
        />
        <div className="flex items-center gap-3">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="text-sm"
            id="note-images"
          />
          <label htmlFor="note-images" className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            <Upload className="w-4 h-4 inline mr-1" />
            Afbeeldingen toevoegen
          </label>
          {imageFiles.length > 0 && (
            <span className="text-sm text-gray-500">
              {imageFiles.length} bestand(en) geselecteerd
            </span>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleAddNote}
            disabled={!noteText.trim() || uploading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {uploading ? 'Toevoegen...' : 'Notitie Toevoegen'}
          </Button>
        </div>
      </div>
    </div>
  );
}