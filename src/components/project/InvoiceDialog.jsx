import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function InvoiceDialog({
  open,
  onOpenChange,
  isEditing,
  invoiceData,
  setInvoiceData,
  invoiceTemplates,
  project,
  user,
  client,
  allClients,
  onSave,
  isSaving,
}) {
  const queryClient = useQueryClient();
  const [showTemplateInput, setShowTemplateInput] = useState(false);
  const [templateName, setTemplateName] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Factuur Bewerken' : 'Factuur Aanmaken'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* A. FACTUURGEGEVENS */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Factuurgegevens</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Factuurnummer</Label>
                <Input value={project?.project_number || ''} disabled className="mt-1.5 bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">Automatisch (= Projectnummer)</p>
              </div>
              <div>
                <Label>Project</Label>
                <Input value={project?.title || ''} disabled className="mt-1.5 bg-gray-50" />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Let op:</strong> Factuurdatum en vervaldatum worden automatisch ingesteld wanneer het project op status "Klaar" wordt gezet.
              </p>
            </div>
          </div>

          {/* Factuursjablonen */}
          <div className="space-y-3">
            <Label htmlFor="template">Gebruik factuursjabloon (optioneel)</Label>
            <select
              id="template"
              value={invoiceData.template_id}
              onChange={(e) => {
                const templateId = e.target.value;
                setInvoiceData({ ...invoiceData, template_id: templateId });
                if (templateId) {
                  const template = invoiceTemplates.find(t => t.id === templateId);
                  if (template?.content) {
                    try {
                      const content = typeof template.content === 'string'
                        ? JSON.parse(template.content) : template.content;
                      if (content.items) {
                        setInvoiceData({
                          ...invoiceData,
                          template_id: templateId,
                          items: content.items,
                          vat_percentage: content.vat_percentage || 21,
                          discount_amount: content.discount_amount || 0,
                        });
                      }
                    } catch (e) {
                      console.error('Error parsing template', e);
                    }
                  }
                }
              }}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">{invoiceTemplates?.length === 0 ? 'Geen sjablonen - maak er een via "Opslaan als sjabloon"' : 'Geen sjabloon'}</option>
              {invoiceTemplates?.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* B. FACTUURONTVANGER */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="custom_recipient"
                checked={invoiceData.use_custom_recipient}
                onChange={(e) => setInvoiceData({ ...invoiceData, use_custom_recipient: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <Label htmlFor="custom_recipient" className="cursor-pointer">
                Gebruik afwijkende factuurontvanger
              </Label>
            </div>
            {!invoiceData.use_custom_recipient ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Factuur wordt verstuurd naar:{' '}
                  <span className="font-medium text-gray-900">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.full_name || client?.company_name || 'Projectklant'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{user?.email || ''}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipient_name">Factuurnaam *</Label>
                  <Input
                    id="recipient_name"
                    value={invoiceData.recipient_name}
                    onChange={(e) => setInvoiceData({ ...invoiceData, recipient_name: e.target.value })}
                    placeholder="Bedrijfsnaam of contactpersoon"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="recipient_email">Factuur e-mail *</Label>
                  <Input
                    id="recipient_email"
                    type="email"
                    value={invoiceData.recipient_email}
                    onChange={(e) => setInvoiceData({ ...invoiceData, recipient_email: e.target.value })}
                    placeholder="facturen@bedrijf.nl"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="recipient_address">Factuuradres *</Label>
                  <Textarea
                    id="recipient_address"
                    value={invoiceData.recipient_address}
                    onChange={(e) => setInvoiceData({ ...invoiceData, recipient_address: e.target.value })}
                    placeholder={"Straat 1\n1234 AB Plaats"}
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Extra client accounts */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-900">Extra client accounts (portal toegang)</h3>
            <p className="text-xs text-gray-500">Selecteer extra klanten die deze factuur in hun portal mogen zien en betalen.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {allClients.map((c) => {
                const isPrimary = c.id === project?.client_id;
                const isChecked = isPrimary || invoiceData.recipient_client_ids.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isPrimary}
                      onChange={(e) => {
                        const next = new Set(invoiceData.recipient_client_ids);
                        if (e.target.checked) next.add(c.id);
                        else next.delete(c.id);
                        setInvoiceData({ ...invoiceData, recipient_client_ids: Array.from(next) });
                      }}
                    />
                    <span>{c.contact_name || c.company_name || c.id}</span>
                  </label>
                );
              })}
              {allClients.length === 0 && <p className="text-xs text-gray-500">Geen klanten gevonden.</p>}
            </div>
          </div>

          {/* CC */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-900">Extra ontvangers (CC)</h3>
            <p className="text-xs text-gray-500">Scheid meerdere adressen met een komma.</p>
            <div>
              <Label htmlFor="cc_emails">CC E-mailadressen</Label>
              <Input
                id="cc_emails"
                value={invoiceData.cc_emails}
                onChange={(e) => setInvoiceData({ ...invoiceData, cc_emails: e.target.value })}
                placeholder="admin@makelaar.nl, boekhouding@bedrijf.nl"
                className="mt-1.5"
              />
            </div>
          </div>

          {/* C. FACTUURITEMS */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-900">Factuuritems</h3>
            <div className="space-y-3">
              {invoiceData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label>Titel *</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => {
                            const newItems = [...invoiceData.items];
                            newItems[index].title = e.target.value;
                            setInvoiceData({ ...invoiceData, items: newItems });
                          }}
                          placeholder="Vastgoedfotografie"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Omschrijving</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...invoiceData.items];
                            newItems[index].description = e.target.value;
                            setInvoiceData({ ...invoiceData, items: newItems });
                          }}
                          placeholder="Optionele details..."
                          className="mt-1.5"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Aantal *</Label>
                          <Input
                            type="number" step="1" min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...invoiceData.items];
                              newItems[index].quantity = e.target.value;
                              setInvoiceData({ ...invoiceData, items: newItems });
                            }}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Prijs per stuk *</Label>
                          <Input
                            type="number" step="0.01" min="0"
                            value={item.unit_price}
                            onChange={(e) => {
                              const newItems = [...invoiceData.items];
                              newItems[index].unit_price = e.target.value;
                              setInvoiceData({ ...invoiceData, items: newItems });
                            }}
                            placeholder="0.00"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Totaal</Label>
                          <div className="mt-1.5 h-9 px-3 py-2 bg-gray-50 rounded-md flex items-center text-sm font-medium">
                            € {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {invoiceData.items.length > 1 && (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => {
                          const newItems = invoiceData.items.filter((_, i) => i !== index);
                          setInvoiceData({ ...invoiceData, items: newItems });
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setInvoiceData({
                ...invoiceData,
                items: [...invoiceData.items, { title: '', description: '', quantity: 1, unit_price: '' }]
              })}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Item toevoegen
            </Button>
            {showTemplateInput ? (
              <div className="space-y-2 border border-blue-100 bg-blue-50/50 p-3 rounded-lg">
                <Label className="text-blue-900">Naam voor nieuw sjabloon</Label>
                <div className="flex gap-2">
                  <Input 
                    value={templateName} 
                    onChange={e => setTemplateName(e.target.value)} 
                    placeholder="bijv. Standaard 2026"
                    className="bg-white"
                    autoFocus
                  />
                  <Button 
                    onClick={async () => {
                      if (!templateName) return;
                      try {
                        await base44.entities.Template.create({
                          name: templateName,
                          type: 'factuur',
                          content: JSON.stringify({
                            items: invoiceData.items,
                            vat_percentage: invoiceData.vat_percentage,
                            discount_amount: invoiceData.discount_amount,
                          }),
                          is_default: false,
                        });
                        queryClient.invalidateQueries({ queryKey: ['invoiceTemplates'] });
                        toast.success('Sjabloon opgeslagen!');
                        setShowTemplateInput(false);
                        setTemplateName('');
                      } catch (err) {
                        console.error('Save template error:', err);
                        toast.error('Kon sjabloon niet opslaan');
                      }
                    }}
                    className="bg-[#5C6B52] hover:bg-[#4A5641] text-white"
                  >
                    Opslaan
                  </Button>
                  <Button variant="ghost" onClick={() => setShowTemplateInput(false)}>Annuleren</Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowTemplateInput(true)}
                disabled={invoiceData.items.every(item => !item.title && !item.unit_price)}
                className="w-full text-[#5C6B52] border-[#A8B5A0] hover:bg-[#E8EDE5]"
              >
                Opslaan als sjabloon
              </Button>
            )}
          </div>

          {/* D. SAMENVATTING */}
          <div className="pt-4 border-t">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotaal</span>
                <span className="font-medium">
                  € {invoiceData.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <Label className="text-gray-600">Korting (€)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={invoiceData.discount_amount}
                  onChange={(e) => setInvoiceData({ ...invoiceData, discount_amount: parseFloat(e.target.value) || 0 })}
                  className="w-24 h-8 text-sm text-right"
                />
              </div>
              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">BTW</span>
                  <Input
                    type="number" step="1" min="0" max="100"
                    value={invoiceData.vat_percentage}
                    onChange={(e) => setInvoiceData({ ...invoiceData, vat_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-16 h-7 text-xs"
                  />
                  <span className="text-gray-600">%</span>
                </div>
                <span className="font-medium">
                  € {(() => {
                    const sub = invoiceData.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
                    const after = sub - (parseFloat(invoiceData.discount_amount) || 0);
                    return (after * (invoiceData.vat_percentage / 100)).toFixed(2);
                  })()}
                </span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                <span className="font-medium">Totaalbedrag</span>
                <span className="font-semibold text-lg">
                  € {(() => {
                    const sub = invoiceData.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0);
                    const disc = parseFloat(invoiceData.discount_amount) || 0;
                    const after = sub - disc;
                    return (after + after * (invoiceData.vat_percentage / 100)).toFixed(2);
                  })()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button
              onClick={onSave}
              disabled={
                isSaving ||
                invoiceData.items.some(i => !i.title || !i.unit_price) ||
                (invoiceData.use_custom_recipient && (!invoiceData.recipient_name || !invoiceData.recipient_email))
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isEditing ? 'Factuur Bijwerken' : 'Factuur Opslaan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}