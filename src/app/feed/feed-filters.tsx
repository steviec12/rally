'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { ACTIVITY_TAGS } from '@/lib/tags';

const DATE_PRESETS = [
  { label: 'Today', getValue: () => todayRange() },
  { label: 'This week', getValue: () => weekRange() },
  { label: 'This weekend', getValue: () => weekendRange() },
] as const;

const DISTANCE_OPTIONS = [5, 10, 25, 50];

function todayRange() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { dateFrom: now.toISOString(), dateTo: end.toISOString() };
}

function weekRange() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + (7 - end.getDay()));
  end.setHours(23, 59, 59, 999);
  return { dateFrom: now.toISOString(), dateTo: end.toISOString() };
}

function weekendRange() {
  const now = new Date();
  const day = now.getDay();
  const satOffset = day === 0 ? 6 : 6 - day;
  const sat = new Date(now);
  sat.setDate(sat.getDate() + satOffset);
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sun.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return { dateFrom: sat.toISOString(), dateTo: sun.toISOString() };
}

interface FeedFiltersProps {
  hasLocation: boolean;
}

export default function FeedFilters({ hasLocation }: FeedFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTags = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];
  const activeDatePreset = searchParams.get('datePreset') ?? null;
  const activeDistance = searchParams.get('distanceKm')
    ? Number(searchParams.get('distanceKm'))
    : null;
  const customTagsActive = searchParams.get('customTags') === 'true';

  const hasFilters =
    activeTags.length > 0 || activeDatePreset || activeDistance || customTagsActive;

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function toggleTag(tag: string) {
    const next = activeTags.includes(tag)
      ? activeTags.filter((t) => t !== tag)
      : [...activeTags, tag];
    updateParams({ tags: next.length ? next.join(',') : null });
  }

  function setDatePreset(preset: string) {
    if (activeDatePreset === preset) {
      updateParams({ datePreset: null, dateFrom: null, dateTo: null });
      return;
    }
    const match = DATE_PRESETS.find((p) => p.label === preset);
    if (!match) return;
    const { dateFrom, dateTo } = match.getValue();
    updateParams({ datePreset: preset, dateFrom, dateTo });
  }

  function setDistance(km: number) {
    if (activeDistance === km) {
      updateParams({ distanceKm: null });
    } else {
      updateParams({ distanceKm: String(km) });
    }
  }

  function clearAll() {
    router.replace('?', { scroll: false });
  }

  const pillBase: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '100px',
    border: '1px solid var(--border)',
    background: 'var(--violet-bg)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  };

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: 'linear-gradient(135deg, var(--fuchsia), var(--violet))',
    color: '#fff',
    border: '1px solid transparent',
  };

  const pillDisabled: React.CSSProperties = {
    ...pillBase,
    opacity: 0.4,
    cursor: 'not-allowed',
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        padding: '16px 20px',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Tags */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8,
          }}
        >
          Activity type
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ACTIVITY_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={activeTags.includes(tag) ? pillActive : pillBase}
            >
              {tag}
            </button>
          ))}
          <button
            onClick={() => updateParams({ customTags: customTagsActive ? null : 'true' })}
            style={customTagsActive ? pillActive : pillBase}
          >
            custom
          </button>
        </div>
      </div>

      {/* Date */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8,
          }}
        >
          When
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setDatePreset(preset.label)}
              style={activeDatePreset === preset.label ? pillActive : pillBase}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8,
          }}
        >
          Distance
        </p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {DISTANCE_OPTIONS.map((km) => (
            <button
              key={km}
              onClick={() => hasLocation && setDistance(km)}
              disabled={!hasLocation}
              style={!hasLocation ? pillDisabled : activeDistance === km ? pillActive : pillBase}
            >
              {km} km
            </button>
          ))}
          {!hasLocation && (
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              Enable location in browser to use
            </span>
          )}
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          style={{
            alignSelf: 'flex-start',
            padding: '6px 14px',
            borderRadius: '100px',
            border: 'none',
            background: 'transparent',
            color: 'var(--fuchsia)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
