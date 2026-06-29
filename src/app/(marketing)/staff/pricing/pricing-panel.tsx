'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { marketingCompactInputClass } from '@/components/ui/marketing-field-styles';

import {
  create_package,
  deactivate_package,
  delete_package,
  update_package,
  type EditablePackage,
  type PackageInput,
} from './actions';
import { partition_packages_by_class, resolve_package_input } from './pricing-panel-state';

type PricingPanelProps = {
  packages: EditablePackage[];
};

type ConfirmRemoveState = {
  id: string;
  name: string;
};

const empty_package: PackageInput = {
  name: '',
  description: '',
  class_type: 'reformer',
  package_type: 'credit_pack',
  credits_included: 8,
  validity_days: 30,
  price: 0,
  sort_order: 10,
  is_active: true,
};

function input_class() {
  return marketingCompactInputClass;
}

function PackageFields({
  pkg,
  id_prefix,
  onChange,
}: {
  pkg: PackageInput;
  id_prefix: string;
  onChange: <K extends keyof PackageInput>(key: K, value: PackageInput[K]) => void;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-foreground" htmlFor={`${id_prefix}-name`}>
          Name
        </label>
        <input
          className={input_class()}
          id={`${id_prefix}-name`}
          onChange={(event) => onChange('name', event.target.value)}
          type="text"
          value={pkg.name}
        />
      </div>
      <div className="sm:col-span-2">
        <label
          className="block text-sm font-medium text-foreground"
          htmlFor={`${id_prefix}-description`}
        >
          Description
        </label>
        <input
          className={input_class()}
          id={`${id_prefix}-description`}
          onChange={(event) => onChange('description', event.target.value)}
          type="text"
          value={pkg.description ?? ''}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor={`${id_prefix}-class`}>
          Class type
        </label>
        <select
          className={input_class()}
          id={`${id_prefix}-class`}
          onChange={(event) => onChange('class_type', event.target.value as PackageInput['class_type'])}
          value={pkg.class_type}
        >
          <option value="reformer">Reformer</option>
          <option value="mat">Mat</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor={`${id_prefix}-type`}>
          Package type
        </label>
        <select
          className={input_class()}
          id={`${id_prefix}-type`}
          onChange={(event) =>
            onChange('package_type', event.target.value as PackageInput['package_type'])
          }
          value={pkg.package_type}
        >
          <option value="drop_in">Single / drop-in</option>
          <option value="credit_pack">Credit pack</option>
          <option value="monthly">Monthly</option>
          <option value="unlimited">Unlimited</option>
          <option value="intro_offer">Intro offer</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor={`${id_prefix}-price`}>
          Price (€)
        </label>
        <input
          className={input_class()}
          id={`${id_prefix}-price`}
          min={0}
          onChange={(event) => onChange('price', Number(event.target.value))}
          step="0.01"
          type="number"
          value={pkg.price}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor={`${id_prefix}-credits`}>
          Credits included
        </label>
        <input
          className={input_class()}
          id={`${id_prefix}-credits`}
          min={0}
          onChange={(event) =>
            onChange(
              'credits_included',
              event.target.value === '' ? null : Number(event.target.value),
            )
          }
          type="number"
          value={pkg.credits_included ?? ''}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor={`${id_prefix}-validity`}>
          Validity (days)
        </label>
        <input
          className={input_class()}
          id={`${id_prefix}-validity`}
          min={1}
          onChange={(event) =>
            onChange(
              'validity_days',
              event.target.value === '' ? null : Number(event.target.value),
            )
          }
          type="number"
          value={pkg.validity_days ?? ''}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground" htmlFor={`${id_prefix}-sort`}>
          Sort order
        </label>
        <input
          className={input_class()}
          id={`${id_prefix}-sort`}
          min={0}
          onChange={(event) => onChange('sort_order', Number(event.target.value))}
          type="number"
          value={pkg.sort_order}
        />
      </div>
      <div className="flex items-end sm:col-span-2">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground">
          <input
            checked={pkg.is_active}
            onChange={(event) => onChange('is_active', event.target.checked)}
            type="checkbox"
          />
          Active on website & membership
        </label>
      </div>
    </div>
  );
}

export function PricingPanel({ packages }: PricingPanelProps) {
  const router = useRouter();
  const action_guard = useRef<string | null>(null);
  const [draft, set_draft] = useState<PackageInput>(empty_package);
  const [dirty_edits, set_dirty_edits] = useState<Record<string, Partial<PackageInput>>>({});
  const [confirm_remove, set_confirm_remove] = useState<ConfirmRemoveState | null>(null);
  const [error, set_error] = useState('');
  const [success, set_success] = useState('');
  const [is_pending, start_transition] = useTransition();

  const { reformer, mat } = partition_packages_by_class(packages, dirty_edits);

  function update_draft<K extends keyof PackageInput>(key: K, value: PackageInput[K]) {
    set_draft((prev) => ({ ...prev, [key]: value }));
  }

  function update_edit<K extends keyof PackageInput>(
    id: string,
    key: K,
    value: PackageInput[K],
  ) {
    set_dirty_edits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  }

  function clear_dirty(id: string) {
    set_dirty_edits((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function refresh(message: string) {
    set_success(message);
    router.refresh();
  }

  function run_guarded(action_key: string, action: () => Promise<void>) {
    if (action_guard.current || is_pending) return;

    action_guard.current = action_key;
    start_transition(async () => {
      try {
        await action();
      } finally {
        action_guard.current = null;
      }
    });
  }

  function handle_create() {
    run_guarded('create', async () => {
      set_error('');
      set_success('');
      const result = await create_package(draft);
      if (!result.success) {
        set_error(result.error);
        return;
      }
      set_draft(empty_package);
      refresh('Package added.');
    });
  }

  function handle_update(id: string) {
    run_guarded(`update:${id}`, async () => {
      set_error('');
      set_success('');
      const pkg = packages.find((entry) => entry.id === id);
      if (!pkg) {
        set_error('Package not found. Refresh the page and try again.');
        return;
      }

      const input = resolve_package_input(pkg, dirty_edits);
      const result = await update_package(id, input);
      if (!result.success) {
        set_error(result.error);
        return;
      }

      clear_dirty(id);
      refresh('Package updated.');
    });
  }

  function handle_deactivate(id: string) {
    run_guarded(`deactivate:${id}`, async () => {
      set_error('');
      set_success('');
      const result = await deactivate_package(id);
      if (!result.success) {
        set_error(result.error);
        return;
      }

      clear_dirty(id);
      set_confirm_remove(null);
      refresh('Package deactivated.');
    });
  }

  function handle_delete(id: string) {
    run_guarded(`delete:${id}`, async () => {
      set_error('');
      set_success('');
      const result = await delete_package(id);
      if (!result.success) {
        set_error(result.error);
        return;
      }

      clear_dirty(id);
      set_confirm_remove(null);
      refresh('Package removed.');
    });
  }

  function render_group(title: string, items: EditablePackage[]) {
    if (items.length === 0) {
      return (
        <p className="rounded-md border border-border bg-surface px-4 py-6 text-sm text-foreground/70">
          No {title.toLowerCase()} packages yet.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((pkg) => {
          const edit_values = resolve_package_input(pkg, dirty_edits);
          const is_confirming_remove = confirm_remove?.id === pkg.id;
          const display_name = edit_values.name.trim() || 'this package';

          return (
            <div
              key={pkg.id}
              className={`rounded-md border p-5 ${edit_values.is_active ? 'border-border bg-surface' : 'border-border bg-muted opacity-80'}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{edit_values.name}</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    €{edit_values.price}
                    {edit_values.is_active ? '' : ' · inactive'}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                  <Button
                    className="w-full sm:w-auto"
                    disabled={is_pending}
                    onClick={() => handle_update(pkg.id)}
                    size="sm"
                    type="button"
                  >
                    Save
                  </Button>
                  {edit_values.is_active ? (
                    <Button
                      className="w-full sm:w-auto"
                      disabled={is_pending}
                      onClick={() => handle_deactivate(pkg.id)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Deactivate
                    </Button>
                  ) : null}
                  {!is_confirming_remove ? (
                    <Button
                      className="w-full border-destructive-border text-destructive hover:bg-destructive-surface sm:w-auto"
                      disabled={is_pending}
                      onClick={() => set_confirm_remove({ id: pkg.id, name: display_name })}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Remove
                    </Button>
                  ) : (
                    <div className="flex w-full flex-col gap-2 rounded-md border border-destructive-border bg-destructive-surface px-3 py-2 sm:w-auto sm:min-w-52">
                      <p className="text-xs leading-5 text-destructive">
                        Permanently remove {display_name}?
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          className="w-full border-destructive-border text-destructive hover:bg-destructive-surface sm:w-auto"
                          disabled={is_pending}
                          onClick={() => handle_delete(pkg.id)}
                          size="sm"
                          type="button"
                          variant="secondary"
                        >
                          {is_pending ? 'Removing…' : 'Confirm remove'}
                        </Button>
                        <button
                          className="inline-flex min-h-11 items-center justify-center text-xs text-foreground/60 hover:text-foreground/90"
                          disabled={is_pending}
                          onClick={() => set_confirm_remove(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <PackageFields
                id_prefix={`edit-${pkg.id}`}
                onChange={(key, value) => update_edit(pkg.id, key, value)}
                pkg={edit_values}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-foreground/70">
        Changes here update the public pricing page, homepage pricing preview, and packages available
        when staff assign memberships. Deactivate hides a package from the website; remove deletes it
        permanently when it is not assigned to any client.
      </p>

      {error ? (
        <p className="rounded-md border border-destructive-border bg-destructive-surface px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-md border border-success-border bg-success-surface px-4 py-3 text-sm text-success">
          {success}
        </p>
      ) : null}

      <div className="rounded-md border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">Add package</h2>
        <PackageFields id_prefix="new-package" onChange={update_draft} pkg={draft} />
        <div className="mt-4">
          <Button className="w-full sm:w-auto" disabled={is_pending} onClick={handle_create} type="button">
            Add package
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Reformer packages</h2>
        {render_group('Reformer', reformer)}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Mat packages</h2>
        {render_group('Mat', mat)}
      </div>
    </div>
  );
}
