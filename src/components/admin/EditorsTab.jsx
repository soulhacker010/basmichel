import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Mail, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const specializationLabels = {
  photo_editor: 'Photo Editor',
  video_editor: 'Video Editor',
  floorplan_editor: 'Floorplan Editor',
};

export default function EditorsTab() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [editingEditor, setEditingEditor] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', specialization: 'photo_editor' });
  const queryClient = useQueryClient();

  const { data: editors = [] } = useQuery({
    queryKey: ['editors'],
    queryFn: () => base44.entities.Editor.list(),
  });

  const inviteEditorMutation = useMutation({
    mutationFn: async (email) => {
      await base44.users.inviteUser(email, 'user');
      return base44.entities.Editor.create({
        email: email,
        status: 'pending',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
      toast.success('Editor uitgenodigd');
      setInviteEmail('');
    },
    onError: () => {
      toast.error('Fout bij uitnodigen');
    },
  });

  const updateEditorMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Editor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
      toast.success('Editor bijgewerkt');
      setEditingEditor(null);
    },
  });

  const deleteEditorMutation = useMutation({
    mutationFn: (id) => base44.entities.Editor.update(id, { status: 'removed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
      toast.success('Editor verwijderd');
    },
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    inviteEditorMutation.mutate(inviteEmail);
  };

  const handleEdit = (editor) => {
    setEditingEditor(editor);
    setEditForm({
      name: editor.name || '',
      specialization: editor.specialization || 'photo_editor',
    });
  };

  const handleSaveEdit = () => {
    if (!editingEditor) return;
    updateEditorMutation.mutate({
      id: editingEditor.id,
      data: editForm,
    });
  };

  const activeEditors = editors.filter(e => e.status === 'active');
  const pendingEditors = editors.filter(e => e.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Editors Beheren</h3>
        <p className="text-sm text-gray-500 mb-6">
          Nodig editors uit om toegang te krijgen tot het editors portaal waar ze projectbestanden kunnen bekijken en bewerken.
        </p>

        <form onSubmit={handleInvite} className="flex gap-3">
          <Input
            type="email"
            placeholder="editor@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
            disabled={inviteEditorMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Uitnodigen
          </Button>
        </form>
      </div>

      {/* Pending Editors */}
      {pendingEditors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            In afwachting ({pendingEditors.length})
          </h4>
          <div className="space-y-2">
            {pendingEditors.map(editor => (
              <div 
                key={editor.id}
                className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-gray-900">{editor.email}</p>
                    <p className="text-xs text-gray-500">Uitnodiging verstuurd</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEditorMutation.mutate(editor.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Editors */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Actieve Editors ({activeEditors.length})
        </h4>
        <div className="space-y-2">
          {activeEditors.map(editor => (
            <div 
              key={editor.id}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{editor.name || editor.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">{editor.email}</p>
                  {editor.specialization && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        editor.specialization === 'photo_editor' && "bg-blue-100 text-blue-700",
                        editor.specialization === 'video_editor' && "bg-purple-100 text-purple-700",
                        editor.specialization === 'floorplan_editor' && "bg-green-100 text-green-700"
                      )}>
                        {specializationLabels[editor.specialization]}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(editor)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEditorMutation.mutate(editor.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {activeEditors.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>Nog geen actieve editors</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEditor} onOpenChange={() => setEditingEditor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editor Bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editor-name">Naam</Label>
              <Input
                id="editor-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Editor naam"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="editor-spec">Specialisatie</Label>
              <select
                id="editor-spec"
                value={editForm.specialization}
                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                className="w-full mt-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="photo_editor">Photo Editor</option>
                <option value="video_editor">Video Editor</option>
                <option value="floorplan_editor">Floorplan Editor</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditingEditor(null)}>
                Annuleren
              </Button>
              <Button 
                onClick={handleSaveEdit}
                className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
              >
                Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}