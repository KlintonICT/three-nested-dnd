import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SubProcessDraggableItem = ({ subprocessId, children }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id: subprocessId,
    data: {
      type: "subprocess",
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="border border-[#3A3F4B] rounded-md cursor-grab bg-[#181A1F]"
    >
      {children}
    </div>
  );
};

export default SubProcessDraggableItem;
