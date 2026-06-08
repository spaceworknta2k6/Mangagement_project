'use client';

export default function Tabs({ tabs, activeTab, onChange, style }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '10px',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
