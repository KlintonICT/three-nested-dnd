import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

const ProcessDraggableItem = ({ processId, children }) => {
  const { setNodeRef, attributes, listeners, transition, transform, isDragging } = useSortable({
    id: processId,
    data: {
      type: 'process',
    },
    disabled: processId === 'single',
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };
  const classes = 'border border-[#3A3F4B] bg-[#181A1F] rounded-md';

  // case for single process that not allow to move
  if (processId === 'single') {
    return <div ref={setNodeRef} className={classes}>{children}</div>;
  }

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style} className={clsx(classes, 'cursor-grab')}>
      {children}
    </div>
  );
};

export default ProcessDraggableItem;
