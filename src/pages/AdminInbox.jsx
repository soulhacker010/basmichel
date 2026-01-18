import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Mail, 
  Search,
  Archive,
  Trash2,
  MailOpen,
  Circle,
  ChevronRight,
  X
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function AdminInbox() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['inboxMessages'],
    queryFn: () => base44.entities.InboxMessage.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InboxMessage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inboxMessages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InboxMessage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inboxMessages'] });
      setDeleteId(null);
      setSelectedMessage(null);
    },
  });

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.subject?.toLowerCase().includes(search.toLowerCase()) ||
      msg.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
      msg.sender_email?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'inbox') return matchesSearch && !msg.is_archived;
    if (filter === 'unread') return matchesSearch && !msg.is_read && !msg.is_archived;
    if (filter === 'archived') return matchesSearch && msg.is_archived;
    return matchesSearch;
  });

  const unreadCount = messages.filter(m => !m.is_read && !m.is_archived).length;

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      updateMutation.mutate({ id: msg.id, data: { is_read: true } });
    }
  };

  const handleArchive = (msg) => {
    updateMutation.mutate({ 
      id: msg.id, 
      data: { is_archived: !msg.is_archived } 
    });
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Inbox"
        description="Bekijk en beheer je berichten"
      />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex h-[calc(100vh-240px)] min-h-[500px]">
          {/* Message List */}
          <div className={cn(
            "w-full md:w-96 border-r border-gray-100 flex flex-col",
            selectedMessage && "hidden md:flex"
          )}>
            {/* Filters */}
            <div className="p-4 border-b border-gray-50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Zoeken..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="w-full bg-gray-100">
                  <TabsTrigger value="inbox" className="flex-1">Inbox</TabsTrigger>
                  <TabsTrigger value="unread" className="flex-1">
                    Ongelezen {unreadCount > 0 && `(${unreadCount})`}
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="flex-1">Archief</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <EmptyState 
                  icon={Mail}
                  title="Geen berichten"
                  description={
                    filter === 'unread' ? "Je hebt geen ongelezen berichten" :
                    filter === 'archived' ? "Je archief is leeg" :
                    "Je inbox is leeg"
                  }
                />
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredMessages.map(msg => (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-gray-50",
                        selectedMessage?.id === msg.id && "bg-[#E8EDE5]",
                        !msg.is_read && "bg-blue-50/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {!msg.is_read && (
                          <Circle className="w-2 h-2 fill-[#A8B5A0] text-[#A8B5A0] mt-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={cn(
                              "text-sm truncate",
                              !msg.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                            )}>
                              {msg.sender_name || msg.sender_email || 'Onbekend'}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {msg.created_date && format(new Date(msg.created_date), 'd MMM', { locale: nl })}
                            </span>
                          </div>
                          <p className={cn(
                            "text-sm truncate",
                            !msg.is_read ? "font-medium text-gray-800" : "text-gray-600"
                          )}>
                            {msg.subject}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className={cn(
            "flex-1 flex flex-col",
            !selectedMessage && "hidden md:flex"
          )}>
            {selectedMessage ? (
              <>
                {/* Message Header */}
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedMessage(null)}
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(selectedMessage)}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {selectedMessage.is_archived ? 'Terugzetten' : 'Archiveren'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(selectedMessage.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Verwijderen
                    </Button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-2xl">
                    <h2 className="text-xl font-medium text-gray-900 mb-4">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-[#E8EDE5] flex items-center justify-center">
                        <span className="text-sm font-medium text-[#5C6B52]">
                          {(selectedMessage.sender_name || selectedMessage.sender_email || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedMessage.sender_name || 'Onbekend'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedMessage.sender_email}
                        </p>
                      </div>
                      <span className="ml-auto text-sm text-gray-400">
                        {selectedMessage.created_date && format(new Date(selectedMessage.created_date), 'd MMMM yyyy, HH:mm', { locale: nl })}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MailOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Selecteer een bericht om te lezen</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bericht Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je dit bericht wilt verwijderen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}