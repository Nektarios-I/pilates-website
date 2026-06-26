'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { marketingCompactInputClass } from '@/components/ui/marketing-field-styles';

import {
  create_session_card,
  delete_session_card,
  update_session_card,
  type EditableSessionCard,
  type SessionCardInput,
} from './actions';

type SessionCardsPanelProps = {
  cards: EditableSessionCard[];
};

const empty_card: SessionCardInput = {
  title: '',
  description: '',
  session_type: 'reformer',
  duration_minutes: 60,
  instructor_name: '',
  image_src: '',
  capacity: 6,
  credits_required: 1,
  reformer_credits_required: 1,
  mat_credits_required: 0,
  sort_order: 10,
  is_active: true,
};

function input_class() {
  return marketingCompactInputClass;
}

export function SessionCardsPanel({ cards }: SessionCardsPanelProps) {
  const router = useRouter();
  const [draft, set_draft] = useState<SessionCardInput>(empty_card);
  const [editing, set_editing] = useState<Record<string, SessionCardInput>>(() =>
    Object.fromEntries(cards.map((card) => [card.id, { ...card }])),
  );
  const [error, set_error] = useState('');
  const [success, set_success] = useState('');
  const [is_pending, start_transition] = useTransition();

  function update_draft<K extends keyof SessionCardInput>(key: K, value: SessionCardInput[K]) {
    set_draft((prev) => ({ ...prev, [key]: value }));
  }

  function update_edit<K extends keyof SessionCardInput>(
    id: string,
    key: K,
    value: SessionCardInput[K],
  ) {
    set_editing((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  function refresh(message: string) {
    set_success(message);
    router.refresh();
  }

  function handle_create() {
    start_transition(async () => {
      set_error('');
      set_success('');
      const result = await create_session_card(draft);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_draft(empty_card);
      refresh('Session card created.');
    });
  }

  function handle_update(id: string) {
    start_transition(async () => {
      set_error('');
      set_success('');
      const result = await update_session_card(id, editing[id]);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      refresh('Session card updated.');
    });
  }

  function handle_delete(id: string) {
    start_transition(async () => {
      set_error('');
      set_success('');
      const result = await delete_session_card(id);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      refresh('Session card removed.');
    });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Add session card</h2>
        <CardFields card={draft} id_prefix="new-card" onChange={update_draft} />
        <div className="mt-4">
          <Button className="w-full sm:w-auto" disabled={is_pending} onClick={handle_create} type="button">
            Add card
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Current session cards</h2>
        {cards.length === 0 ? (
          <p className="text-sm text-foreground/60">No cards yet.</p>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="rounded-md border border-border bg-background p-6">
              <CardFields
                card={editing[card.id] ?? card}
                id_prefix={card.id}
                onChange={(key, value) => update_edit(card.id, key, value)}
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  className="w-full sm:w-auto"
                  disabled={is_pending}
                  onClick={() => handle_update(card.id)}
                  type="button"
                >
                  Save
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  disabled={is_pending}
                  onClick={() => handle_delete(card.id)}
                  type="button"
                  variant="secondary"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">{success}</p> : null}
    </div>
  );
}

function CardFields({
  card,
  id_prefix,
  onChange,
}: {
  card: SessionCardInput;
  id_prefix: string;
  onChange: <K extends keyof SessionCardInput>(key: K, value: SessionCardInput[K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-title`}>
        Title
        <input
          className={input_class()}
          id={`${id_prefix}-title`}
          value={card.title}
          onChange={(event) => onChange('title', event.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-type`}>
        Class type
        <select
          className={input_class()}
          id={`${id_prefix}-type`}
          value={card.session_type}
          onChange={(event) =>
            onChange('session_type', event.target.value as SessionCardInput['session_type'])
          }
        >
          <option value="reformer">Reformer</option>
          <option value="mat">Mat</option>
          <option value="private">Private</option>
          <option value="intro">Intro</option>
        </select>
      </label>

      <label className="block text-sm font-medium text-foreground/80 sm:col-span-2" htmlFor={`${id_prefix}-description`}>
        Description
        <textarea
          className={input_class()}
          id={`${id_prefix}-description`}
          rows={3}
          value={card.description}
          onChange={(event) => onChange('description', event.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-duration`}>
        Duration minutes
        <input
          className={input_class()}
          id={`${id_prefix}-duration`}
          min={15}
          type="number"
          value={card.duration_minutes}
          onChange={(event) => onChange('duration_minutes', Number(event.target.value))}
        />
      </label>

      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-capacity`}>
        Capacity
        <input
          className={input_class()}
          id={`${id_prefix}-capacity`}
          min={1}
          type="number"
          value={card.capacity}
          onChange={(event) => onChange('capacity', Number(event.target.value))}
        />
      </label>

      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-reformer-credits`}>
        Reformer credits required
        <input
          className={input_class()}
          id={`${id_prefix}-reformer-credits`}
          min={0}
          type="number"
          value={card.reformer_credits_required}
          onChange={(event) => onChange('reformer_credits_required', Number(event.target.value))}
        />
      </label>

      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-mat-credits`}>
        Mat credits required
        <input
          className={input_class()}
          id={`${id_prefix}-mat-credits`}
          min={0}
          type="number"
          value={card.mat_credits_required}
          onChange={(event) => onChange('mat_credits_required', Number(event.target.value))}
        />
      </label>

      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-sort`}>
        Sort order
        <input
          className={input_class()}
          id={`${id_prefix}-sort`}
          type="number"
          value={card.sort_order}
          onChange={(event) => onChange('sort_order', Number(event.target.value))}
        />
      </label>

      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-instructor`}>
        Instructor
        <input
          className={input_class()}
          id={`${id_prefix}-instructor`}
          value={card.instructor_name ?? ''}
          onChange={(event) => onChange('instructor_name', event.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-foreground/80" htmlFor={`${id_prefix}-image`}>
        Image URL
        <input
          className={input_class()}
          id={`${id_prefix}-image`}
          placeholder="/images/class.jpg"
          value={card.image_src ?? ''}
          onChange={(event) => onChange('image_src', event.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <input
          checked={card.is_active}
          type="checkbox"
          onChange={(event) => onChange('is_active', event.target.checked)}
        />
        Active on booking page
      </label>
    </div>
  );
}
