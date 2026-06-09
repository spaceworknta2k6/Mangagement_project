'use client';

import css from './Tabs.module.css';

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  const rootClass = [css.tabs, className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const tabClass = [css.tab, isActive ? css.active : ''].filter(Boolean).join(' ');

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={tabClass}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
