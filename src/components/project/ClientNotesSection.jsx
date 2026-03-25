import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function ClientNotesSection({ projectId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Project.update(projectId, { client_notes: notes });
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    toast.success('Notitie opgeslagen');
    setSaving(false);
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Notities voor Bas Michel</p>
      <p className="text-xs text-gray-400 mb-2">Laat hier opmerkingen of wensen achter voor de fotograaf.</p>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        placeholder="Bijv. specifieke wensen, sleutelafspraken, bijzonderheden..."
        className="text-sm"
      />
      <Button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 w-full bg-[#5C6B52] hover:bg-[#4A5641] text-white"
        size="sm"
      >
        {saving ? 'Opslaan...' : 'Notitie opslaan'}
      </Button>
    </div>
  );
}