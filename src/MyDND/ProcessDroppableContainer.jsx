import { useDroppable } from "@dnd-kit/core";

const SubProcessDraggableItem = ({ processId, children }) => {
  const { setNodeRef } = useDroppable({
    id: processId,
    data: { accepts: "subprocessAndActivity" },
  });

  return (
    <div
      ref={setNodeRef}
      className="border border-[#29327A] p-4 bg-[#17204A] rounded"
    >
      {children}
    </div>
  );
};

export default SubProcessDraggableItem;
