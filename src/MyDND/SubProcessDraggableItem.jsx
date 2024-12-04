import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DraggableSubProcessItem = ({ subprocessId, children }) => {
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
    opacity: isDragging ? 0.2 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="border border-[#29327A] rounded cursor-grab bg-[#17204A]"
    >
      {children}
    </div>
  );
};

export default DraggableSubProcessItem;
