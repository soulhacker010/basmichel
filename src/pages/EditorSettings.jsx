import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

export default function EditorSettings() {
  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const [editorName, setEditorName] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('editorDarkMode') === 'true';
  });
  
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData]);

  const { data: editors = [] } = useQuery({
    queryKey: ['editors'],
    queryFn: () => base44.entities.Editor.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && editors.length > 0) {
      const editorData = editors.find(e => e.user_id === user.id && e.status === 'active');
      if (editorData) {
        setEditor(editorData);
        setEditorName(editorData.name || '');
      } else if (user.role === 'admin') {
        // Admin without editor record
        setEditorName(user.full_name || user.email);
      }
    }
  }, [user, editors]);

  const updateEditorMutation = useMutation({
    mutationFn: async (data) => {
      if (editor && editor.id) {
        return await base44.entities.Editor.update(editor.id, data);
      } else if (user?.role === 'admin') {
        // Create editor record for admin if doesn't exist
        return await base44.entities.Editor.create({
          user_id: user.id,
          name: data.name,
          email: user.email,
          status: 'active',
        });
      }
      throw new Error('No editor profile');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editors'] });
      toast.success('Name updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update name');
      console.error(error);
    },
  });

  const handleSave = () => {
    if (!editorName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    updateEditorMutation.mutate({ name: editorName });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className={cn("text-2xl font-light", darkMode ? "text-gray-100" : "text-gray-900")}>
          Settings
        </h1>
        <p className={cn("mt-1", darkMode ? "text-gray-400" : "text-gray-500")}>
          Manage your editor profile
        </p>
      </div>

      {/* Profile Settings */}
      <div className={cn("rounded-xl p-8", darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100")}>
        <div className="flex items-center gap-4 mb-6">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center",
            darkMode ? "bg-purple-900/50" : "bg-purple-100"
          )}>
            <User className={cn("w-8 h-8", darkMode ? "text-purple-300" : "text-purple-700")} />
          </div>
          <div>
            <h2 className={cn("text-lg font-medium", darkMode ? "text-gray-100" : "text-gray-900")}>
              Profile Information
            </h2>
            <p className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>
              Update your display name
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="email" className={cn(darkMode ? "text-gray-300" : "text-gray-700")}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className={cn("mt-1.5", darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-50")}
            />
            <p className={cn("text-xs mt-1", darkMode ? "text-gray-500" : "text-gray-400")}>
              Email cannot be changed
            </p>
          </div>

          <div>
            <Label htmlFor="name" className={cn(darkMode ? "text-gray-300" : "text-gray-700")}>
              Display Name
            </Label>
            <Input
              id="name"
              type="text"
              value={editorName}
              onChange={(e) => setEditorName(e.target.value)}
              placeholder="Enter your name"
              className={cn("mt-1.5", darkMode && "bg-gray-700 text-gray-100 border-gray-600")}
            />
            <p className={cn("text-xs mt-1", darkMode ? "text-gray-500" : "text-gray-400")}>
              This name will appear in the editor portal
            </p>
          </div>

          {editor?.specialization && (
            <div>
              <Label className={cn(darkMode ? "text-gray-300" : "text-gray-700")}>
                Specialization
              </Label>
              <div className={cn("mt-1.5 px-3 py-2 rounded-md text-sm",
                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-700"
              )}>
                {editor.specialization.replace('_', ' ')}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              disabled={updateEditorMutation.isPending || !editorName.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {updateEditorMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}