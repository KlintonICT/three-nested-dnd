import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ActivityItem = ({ data, processId }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: data?.id,
    data: { type: "activity", processContainer: processId },
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
      className="bg-[#232A67] text-sm text-white cursor-grab"
    >
      <td className="p-3">{data?.id}</td>
      <td>{data?.name}</td>
    </tr>
  );
};

export default ActivityItem;
