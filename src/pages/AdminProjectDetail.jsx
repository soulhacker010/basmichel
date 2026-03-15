import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Upload,
  Download,
  CheckCircle2,
  Trash2,
  Loader2,
  ChevronDown,
  FileText,
  Plus,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import EditorNotesSection from '@/components/project/EditorNotesSection';
import AddEditorNote from '@/components/project/AddEditorNote';
import ExtraSessionsSection from '@/components/project/ExtraSessionsSection';
import InvoiceDialog from '@/components/project/InvoiceDialog';
...
      {/* Invoice Dialog */}
      <InvoiceDialogPlaceholder
            {/* A. FACTUURGEGEVENS */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Factuurgegevens</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Factuurnummer</Label>
                  <Input value={project.project_number || ''} disabled className="mt-1.5 bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Automatisch (= Projectnummer)</p>
                </div>
                <div>
                  <Label>Project</Label>
                  <Input value={project.title || ''} disabled className="mt-1.5 bg-gray-50" />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>Let op:</strong> Factuurdatum en vervaldatum worden automatisch ingesteld wanneer het project op status "Klaar" wordt gezet.
                </p>
              </div>
            </div>

            {/* Factuursjablonen */}
            {invoiceTemplates.length > 0 && (
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
                      if (template && template.content) {
                        try {
                          const content = typeof template.content === 'string' ?
                            JSON.parse(template.content) : template.content;

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
                  <option value="">Geen sjabloon</option>
                  {invoiceTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                    Factuur wordt verstuurd naar: <span className="font-medium text-gray-900">
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
                      placeholder="Straat 1&#10;1234 AB Plaats"
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
              <p className="text-xs text-gray-500">Selecteer extra klanten die deze factuur in hun portal mogen zien en betalen. De hoofdklant van het project is altijd geselecteerd.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {allClients.map((c) => {
                  const isPrimary = c.id === project?.client_id;
                  const isChecked = isPrimary || invoiceData.recipient_client_ids.includes(c.id);
                  const label = c.contact_name || c.company_name || c.id;
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
                      <span>{label}</span>
                    </label>
                  );
                })}
                {allClients.length === 0 && (
                  <p className="text-xs text-gray-500">Geen klanten gevonden.</p>
                )}
              </div>
            </div>

            {/* CC / Extra ontvangers */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-900">Extra ontvangers (CC)</h3>
              <p className="text-xs text-gray-500">Voeg extra e-mailadressen toe die een kopie van de factuur ontvangen. Scheid meerdere adressen met een komma. Bas zijn administratie (basmichelsite@gmail.com) ontvangt altijd automatisch een kopie.</p>
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
                          <Label htmlFor={`item_title_${index}`}>Titel *</Label>
                          <Input
                            id={`item_title_${index}`}
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...invoiceData.items];
                              newItems[index].title = e.target.value;
                              setInvoiceData({ ...invoiceData, items: newItems });
                            }}
                            placeholder="Bijvoorbeeld: Vastgoedfotografie"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`item_description_${index}`}>Omschrijving</Label>
                          <Textarea
                            id={`item_description_${index}`}
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
                            <Label htmlFor={`item_quantity_${index}`}>Aantal *</Label>
                            <Input
                              id={`item_quantity_${index}`}
                              type="number"
                              step="1"
                              min="1"
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
                            <Label htmlFor={`item_price_${index}`}>Prijs per stuk *</Label>
                            <Input
                              id={`item_price_${index}`}
                              type="number"
                              step="0.01"
                              min="0"
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
                          variant="ghost"
                          size="sm"
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
                onClick={() => {
                  setInvoiceData({
                    ...invoiceData,
                    items: [...invoiceData.items, { title: '', description: '', quantity: 1, unit_price: '' }]
                  });
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Item toevoegen
              </Button>
            </div>

            {/* D. SAMENVATTING */}
            <div className="pt-4 border-t">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotaal</span>
                  <span className="font-medium text-gray-900">
                    € {invoiceData.items.reduce((sum, item) => {
                      return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                    }, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <Label htmlFor="discount" className="text-gray-600">Korting (€)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={invoiceData.discount_amount}
                    onChange={(e) => setInvoiceData({ ...invoiceData, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-24 h-8 text-sm text-right"
                  />
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">BTW</span>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={invoiceData.vat_percentage}
                      onChange={(e) => setInvoiceData({ ...invoiceData, vat_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-16 h-7 text-xs"
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    € {(() => {
                      const subtotal = invoiceData.items.reduce((sum, item) => {
                        return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                      }, 0);
                      const afterDiscount = subtotal - (parseFloat(invoiceData.discount_amount) || 0);
                      return (afterDiscount * (invoiceData.vat_percentage / 100)).toFixed(2);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-900">Totaalbedrag</span>
                  <span className="font-semibold text-gray-900 text-lg">
                    € {(() => {
                      const subtotal = invoiceData.items.reduce((sum, item) => {
                        return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0));
                      }, 0);
                      const discount = parseFloat(invoiceData.discount_amount) || 0;
                      const afterDiscount = subtotal - discount;
                      const vat = afterDiscount * (invoiceData.vat_percentage / 100);
                      return (afterDiscount + vat).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                Annuleren
              </Button>
              <Button
                onClick={() => {
                  if (isEditingInvoice) {
                    updateInvoiceMutation.mutate(invoiceData);
                  } else {
                    createInvoiceMutation.mutate(invoiceData);
                  }
                }}
                disabled={
                  invoiceData.items.some(item => !item.title || !item.unit_price) ||
                  (invoiceData.use_custom_recipient && (!invoiceData.recipient_name || !invoiceData.recipient_email))
                }
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isEditingInvoice ? 'Factuur Bijwerken' : 'Factuur Opslaan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}