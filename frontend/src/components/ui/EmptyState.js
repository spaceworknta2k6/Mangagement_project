import { FolderSimple } from '@phosphor-icons/react';
import css from './EmptyState.module.css';

/**
 * EmptyState component for showing unified placeholder when lists or grids are empty.
 * @param {string} title
 * @param {string} description
 * @param {React.Component} icon
 */
export default function EmptyState({ 
  title = 'Không có dữ liệu', 
  description = 'Hiện tại chưa có bản ghi nào được tìm thấy.', 
  icon: Icon = FolderSimple 
}) {
  return (
    <div className={css.container}>
      <Icon size={48} weight="duotone" className={css.icon} />
      <h3 className={css.title}>{title}</h3>
      <p className={css.description}>{description}</p>
    </div>
  );
}
