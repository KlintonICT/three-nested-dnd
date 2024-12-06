import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Table = ({ children }) => (
  <table className='w-full'>
    {children}
    <thead>
      <tr className='text-[#ABB2BF] text-sm font-semibold bg-[#1E222A]'>
        <th className='text-left w-1/2 p-3'>ID</th>
        <th className='text-left'>Name</th>
      </tr>
    </thead>
  </table>
);

const Body = ({ children }) => <tbody>{children}</tbody>;

const RowItem = ({ data, processId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: data?.id,
    data: { type: 'activity', processContainerId: processId },
  });

  return (
    <tr
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.2 : 1,
      }}
      className='bg-[#2C313A] text-sm text-[#ABB2BF] cursor-grab'
    >
      <td className='p-3 w-1/2'>{data?.id}</td>
      <td>{data?.name}</td>
    </tr>
  );
};

const ActivityTable = Object.assign(Table, { Body, RowItem });
export default ActivityTable;
