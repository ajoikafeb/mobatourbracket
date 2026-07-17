"use client";

import { useState, useEffect, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Save,
  ArrowLeft,
  Eye,
  Type,
  Mail,
  Phone,
  Hash,
  List,
  CheckSquare,
  Calendar,
  Upload,
  MessageSquare,
  Gamepad2,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getEventById } from "@/services/event-service";
import {
  getFormByEventId,
  createForm,
  getFormFields,
  createField,
  updateField,
  deleteField,
} from "@/services/registration-service";
import type { RegistrationField, FieldType, Event } from "@/lib/types";

const FIELD_TYPES: { value: FieldType; label: string; icon: typeof Type }[] = [
  { value: "text", label: "Text", icon: Type },
  { value: "long_text", label: "Long Text", icon: MessageSquare },
  { value: "email", label: "Email", icon: Mail },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "number", label: "Number", icon: Hash },
  { value: "dropdown", label: "Dropdown", icon: List },
  { value: "radio", label: "Radio", icon: CheckSquare },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "textarea", label: "Textarea", icon: MessageSquare },
  { value: "date", label: "Date", icon: Calendar },
  { value: "upload", label: "File Upload", icon: Upload },
  { value: "discord", label: "Discord Username", icon: Gamepad2 },
  { value: "telegram", label: "Telegram", icon: MessageSquare },
  { value: "kick_username", label: "Kick Username", icon: Gamepad2 },
  { value: "ml_id", label: "Mobile Legends ID", icon: Gamepad2 },
  { value: "server_id", label: "Server ID", icon: Gamepad2 },
  { value: "custom", label: "Custom", icon: Type },
];

const hasOptions = (type: FieldType) =>
  ["dropdown", "radio", "checkbox"].includes(type);

function FieldIcon({ type }: { type: FieldType }) {
  const found = FIELD_TYPES.find((f) => f.value === type);
  const Icon = found?.icon ?? Type;
  return <Icon className="h-4 w-4" />;
}

export default function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);

  const [event, setEvent] = useState<Event | null>(null);
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);

  const [newType, setNewType] = useState<FieldType>("text");
  const [newLabel, setNewLabel] = useState("");
  const [newPlaceholder, setNewPlaceholder] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const ev = await getEventById(eventId);
        setEvent(ev);

        let form = await getFormByEventId(eventId);
        if (!form) {
          form = await createForm({
            event_id: eventId,
            title: ev?.title ? `${ev.title} Registration` : "Registration Form",
            description: "",
            is_active: true,
          });
        }
        setFormId(form.id);

        const existingFields = await getFormFields(form.id);
        setFields(existingFields);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  const handleAddField = useCallback(() => {
    if (!newLabel.trim() || !formId) return;

    const opts = hasOptions(newType)
      ? newOptions.split(",").map((o) => o.trim()).filter(Boolean)
      : [];

    const field: RegistrationField = {
      id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      form_id: formId,
      field_type: newType,
      label: newLabel.trim(),
      placeholder: newPlaceholder.trim(),
      required: newRequired,
      options: opts,
      validation: {},
      sort_order: fields.length,
      created_at: new Date().toISOString(),
    };

    setFields((prev) => [...prev, field]);
    setNewLabel("");
    setNewPlaceholder("");
    setNewRequired(false);
    setNewOptions("");
  }, [newType, newLabel, newPlaceholder, newRequired, newOptions, fields.length, formId]);

  const handleDeleteField = useCallback((fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  }, []);

  const handleMoveField = useCallback((index: number, direction: "up" | "down") => {
    setFields((prev) => {
      const next = [...prev];
      const swap = direction === "up" ? index - 1 : index + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next.map((f, i) => ({ ...f, sort_order: i }));
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!formId) return;
    setSaving(true);
    try {
      const toDelete = fields.filter((f) => f.id.startsWith("new_"));
      const existing = fields.filter((f) => !f.id.startsWith("new_"));

      for (const f of toDelete) {
        const { id: _id, created_at: _ca, ...rest } = f;
        const created = await createField({ ...rest, sort_order: f.sort_order });
        const idx = fields.findIndex((x) => x.id === f.id);
        if (idx !== -1) {
          setFields((prev) => prev.map((x) => (x.id === f.id ? { ...x, id: created.id, created_at: created.created_at } : x)));
        }
      }

      for (const f of existing) {
        await updateField(f.id, {
          label: f.label,
          placeholder: f.placeholder,
          required: f.required,
          options: f.options,
          sort_order: f.sort_order,
          field_type: f.field_type,
          validation: f.validation,
        });
      }

      const freshFields = await getFormFields(formId);
      setFields(freshFields);
    } catch {
    } finally {
      setSaving(false);
    }
  }, [formId, fields]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin/events">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">
                Form Builder
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {event?.title ?? "Loading event..."}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Fields"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fields List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Fields ({fields.length})
            </h2>

            <AnimatePresence mode="popLayout">
              {fields.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <Eye className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600">No fields yet. Add your first field below.</p>
                </motion.div>
              )}

              {fields.map((field, idx) => (
                <motion.div
                  key={field.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-zinc-700 mt-1 shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-orange-400">
                            <FieldIcon type={field.field_type} />
                          </span>
                          <span className="text-sm font-medium text-white truncate">
                            {field.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.05] text-zinc-500 border border-white/[0.06]">
                            {FIELD_TYPES.find((f) => f.value === field.field_type)?.label}
                          </span>
                          {field.required && (
                            <span className="text-[10px] text-red-400">Required</span>
                          )}
                        </div>

                        {/* Preview */}
                        <div className="pointer-events-none">
                          {field.field_type === "dropdown" ? (
                            <div className="h-9 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 flex items-center text-xs text-zinc-600">
                              {field.placeholder || field.label}
                            </div>
                          ) : field.field_type === "radio" || field.field_type === "checkbox" ? (
                            <div className="flex flex-wrap gap-2">
                              {field.options.map((opt, oi) => (
                                <span key={oi} className="text-xs text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1">
                                  {opt}
                                </span>
                              ))}
                              {field.options.length === 0 && (
                                <span className="text-xs text-zinc-700 italic">No options</span>
                              )}
                            </div>
                          ) : field.field_type === "textarea" || field.field_type === "long_text" ? (
                            <div className="h-16 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs text-zinc-600">
                              {field.placeholder || field.label}
                            </div>
                          ) : field.field_type === "upload" ? (
                            <div className="h-16 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] flex items-center justify-center text-xs text-zinc-700">
                              Click or drag to upload
                            </div>
                          ) : (
                            <Input
                              placeholder={field.placeholder || field.label}
                              disabled
                              className="h-9 text-xs"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleMoveField(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveField(idx, "down")}
                          disabled={idx === fields.length - 1}
                          className="p-1 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add Field Panel */}
          <div className="lg:col-span-1">
            <Card className="p-5 sticky top-8">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4 text-orange-400" />
                Add Field
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Field Type</label>
                  <Select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as FieldType)}
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft.value} value={ft.value}>
                        {ft.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Label *</label>
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Team Name"
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Placeholder</label>
                  <Input
                    value={newPlaceholder}
                    onChange={(e) => setNewPlaceholder(e.target.value)}
                    placeholder="e.g. Enter your team name"
                    className="h-9 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs text-zinc-500">Required</label>
                  <button
                    onClick={() => setNewRequired((r) => !r)}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors duration-200",
                      newRequired ? "bg-orange-500" : "bg-white/[0.08]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow-sm",
                        newRequired ? "translate-x-[18px]" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>

                {hasOptions(newType) && (
                  <div>
                    <label className="text-xs text-zinc-500 mb-1.5 block">Options (comma-separated)</label>
                    <textarea
                      value={newOptions}
                      onChange={(e) => setNewOptions(e.target.value)}
                      placeholder="Option 1, Option 2, Option 3"
                      rows={3}
                      className="flex w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-zinc-600 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:border-orange-500/30 focus-visible:bg-white/[0.06] resize-none"
                    />
                  </div>
                )}

                <Button
                  onClick={handleAddField}
                  disabled={!newLabel.trim()}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
