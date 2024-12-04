import { CSS } from "@dnd-kit/utilities";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Children } from "react";

export const Item = ({ item, children }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "card",
    },
  });
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    background: "lightgreen",
    textAlign: "center",
    margin: 10,
    padding: 5,
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      {item.text}
      {children}
    </div>
  );
};
