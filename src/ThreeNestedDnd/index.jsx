import React, { useState } from "react";
import {
  DndContext,
  TouchSensor,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  closestCenter,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Item } from "./Item";
// import { Droppable } from "react-beautiful-dnd";
const NestedList = () => {
  const [items, setItems] = useState({
    A: [
      {
        id: "1",
        text: "A1",
        blocks: [
          { id: "11", text: "1 - subtextA1" },
          { id: "12", text: "2 - subtextA1" },
          { id: "13", text: "3 - subtextA1" },
        ],
      },
      {
        id: "2",
        text: "A2",
        blocks: [
          { id: "14", text: "1 - subtextA2" },
          { id: "15", text: "2 - subtextA2" },
          { id: "16", text: "3 - subtextA2" },
        ],
      },
      {
        id: "3",
        text: "A3",
        blocks: [
          { id: "17", text: "1 - subtextA3" },
          { id: "18", text: "2 - subtextA3" },
          { id: "19", text: "3 - subtextA3" },
        ],
      },
    ],
    B: [
      {
        id: "6",
        text: "B1",
        blocks: [
          { id: "50", text: "1 - subtextB1" },
          { id: "20", text: "2 - subtextB1" },
          { id: "21", text: "3 - subtextB1" },
        ],
      },
      {
        id: "7",
        text: "B2",
        blocks: [
          { id: "22", text: "1 - subtextB2" },
          { id: "23", text: "2 - subtextB2" },
          { id: "24", text: "3 - subtextB2" },
        ],
      },
      {
        id: "8",
        text: "B3",
        blocks: [
          { id: "25", text: "1 - subtextB3" },
          { id: "26", text: "2 - subtextB3" },
          { id: "27", text: "3 - subtextB3" },
        ],
      },
    ],
  });

  const cardsList = {};

  const findContainer = (id) => {
    if (id in items) {
      return id;
    }
    return Object.keys(items).find((key) =>
      items[key].map((item) => item.id).includes(id),
    );
  };

  /*************  ✨ Codeium Command ⭐  *************/
  /**
   * Finds the card of a given block id.
   * @param {string} id - the id of the block
   * @returns {string} the id of the card
   */
  /******  d35a1fc3-5ced-4073-9420-12f8dcbc1854  *******/
  const findCard = (id) => {
    const array = [].concat.apply([], Object.values(items));
    array.forEach((card) => (cardsList[card.id] = card.blocks));

    if (id in cardsList) {
      return id;
    }
    return Object.keys(cardsList).find((cardid) =>
      cardsList[cardid].map((item) => item.id).includes(id),
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeItem, setActiveItem] = useState();
  const [activeBlock, setActiveBlock] = useState();

  const handleDragStart = (result) => {
    if (result.active.data.current.type === "card") {
      //if the draggable type is card set the activeItem to the card
      const container = findContainer(result.active.id);
      const idx = items[container].findIndex(
        (item) => item.id === result.active.id,
      );
      setActiveItem(items[container][idx]);
    }
    if (result.active.data.current.type === "block") {
      //if the draggable type is block set the activeBlock to the block
      const cardId = findCard(result.active.id);
      const idx = cardsList[cardId].findIndex(
        (item) => item.id === result.active.id,
      );
      setActiveBlock(cardsList[cardId][idx]);
    }
  };

  const handleDragOver = (result) => {
    const { active, over } = result;
    const overId = over?.id;
    if (overId == null || active.id in items) {
      return;
    }

    console.log("Sample: ", { active, over });

    if (result.active.data.current.type === "card") {
      // if the draggable type is card move the card to the new container
      const overContainer = findContainer(overId);
      const activeContainer = findContainer(active.id);

      console.log({ overContainer, activeContainer });

      if (!overContainer || !activeContainer) {
        console.log("No container found");
        return;
      }

      if (activeContainer !== overContainer) {
        setItems((items) => {
          const activeItems = items[activeContainer];
          const overItems = items[overContainer];

          const overIndex = overItems.findIndex((item) => item.id === overId);
          const activeIndex = activeItems.findIndex(
            (item) => item.id === active.id,
          );

          // let newIndex;
          // if (overId in items) {
          //   newIndex = overItems.length + 1;
          // } else {
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height;

          const modifier = isBelowOverItem ? 1 : 0;
          const newIndex =
            overIndex > 0 ? overIndex + modifier : overItems.length + 1;
          // }

          // recentlyMovedToNewContainer.current = true;

          return {
            ...items,
            [activeContainer]: items[activeContainer].filter(
              (item) => item.id !== active.id,
            ),
            [overContainer]: [
              ...items[overContainer].slice(0, newIndex),
              items[activeContainer][activeIndex],
              ...items[overContainer].slice(
                newIndex,
                items[overContainer].length,
              ),
            ],
          };
        });
      }
    } else if (result.active.data.current.type === "block") {
      // if the draggable type is block move the block to the new card
      const overCard = findCard(overId);
      const activeCard = findCard(active.id);

      if (!overCard || !activeCard) {
        console.log("No card found");
        return;
      }

      const activeContainer = result.active.data.current.container;
      const overContainer = result.over.data.current.container;

      if (overCard !== activeCard) {
        const activeBlocks = cardsList[activeCard];
        const overBlocks = cardsList[overCard];

        const overIndex = overBlocks.findIndex((item) => item.id === overId);
        const activeIndex = activeBlocks.findIndex(
          (item) => item.id === active.id,
        );

        let newIndex;
        if (overId in cardsList) {
          newIndex = overBlocks.length + 1;
        } else {
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height;

          const modifier = isBelowOverItem ? 1 : 0;
          newIndex =
            overIndex > 0 ? overIndex + modifier : overBlocks.length + 1;
        }

        const newCardsList = {
          ...cardsList,
          [activeCard]: cardsList[activeCard].filter(
            (item) => item.id !== active.id,
          ),
          [overCard]: [
            ...cardsList[overCard].slice(0, newIndex),
            cardsList[activeCard][activeIndex],
            ...cardsList[overCard].slice(newIndex, cardsList[overCard].length),
          ],
        };

        const newItems = { ...items };
        const newActiveContainer = newItems[activeContainer].map((card) => {
          if (card.id === activeCard) {
            card.blocks = newCardsList[activeCard];
          }
          return card;
        });
        const newOverContainer = newItems[overContainer].map((card) => {
          if (card.id === overCard) {
            card.blocks = newCardsList[overCard];
          }
          return card;
        });
        newItems[activeContainer] = newActiveContainer;
        newItems[overContainer] = newOverContainer;

        setItems(newItems);
      }
    }
  };

  const handleDragEnd = (result) => {
    const { active, over } = result;
    console.log(result);
    if (result.active.data.current.type === "card") {
      const activeContainer = findContainer(active.id);

      if (!activeContainer) {
        setActiveItem(null);
        return;
      }

      const overId = over?.id;

      if (overId == null) {
        setActiveItem(null);
        return;
      }

      const overContainer = findContainer(overId);
      if (overContainer) {
        const activeIndex = items[activeContainer].findIndex(
          (item) => item.id === active.id,
        );
        const overIndex = items[overContainer].findIndex(
          (item) => item.id === overId,
        );

        if (activeIndex !== overIndex) {
          setItems((items) => ({
            ...items,
            [overContainer]: arrayMove(
              items[overContainer],
              activeIndex,
              overIndex,
            ),
          }));
        }
      }
    } else if (result.active.data.current.type === "block") {
      console.log("block drag end");
      const activeCard = findCard(active.id);
      if (!activeCard) {
        setActiveBlock(null);
        return;
      }
      const overId = over?.id;
      if (overId == null) {
        setActiveBlock(null);
        return;
      }
      const overCard = findCard(overId);
      const overContainer = result.over.data.current.container;
      if (overCard) {
        const activeIndex = cardsList[activeCard].findIndex(
          (item) => item.id === active.id,
        );
        const overIndex = cardsList[overCard].findIndex(
          (item) => item.id === overId,
        );
        const newCardsList = {
          ...cardsList,
          [overCard]: arrayMove(cardsList[overCard], activeIndex, overIndex),
        };

        const newItems = { ...items };
        const newOverContainer = newItems[overContainer].map((card) => {
          if (card.id === overCard) {
            card.blocks = newCardsList[overCard];
          }
          return card;
        });
        console.log(newCardsList);
        newItems[overContainer] = newOverContainer;
        setItems(newItems);
      }
    }
    setActiveBlock(null);
    setActiveItem(null);
  };

  const handleDragCancel = () => {
    setActiveItem(null);
    setActiveBlock(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        style={{
          display: "inline-grid",
          boxSizing: "border-box",
          padding: 20,
          gridAutoFlow: "column",
          width: "100%",
        }}
      >
        {Object.keys(items).map((container) => {
          return (
            <div style={{ textAlign: "center" }} key={container}>
              <h1 style={{ marginTop: 10, fontSize: 24 }}>{container}</h1>
              <CardDroppableContainer container={container}>
                <SortableContext
                  items={items[container].map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items[container].map((item) => {
                    return (
                      <Item item={item} key={item.id}>
                        <BlockDroppableContainer cardId={item.id}>
                          <SortableContext
                            items={item.blocks.map((block) => block.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {item.blocks.map((block) => {
                              return (
                                <Block
                                  block={block}
                                  container={container}
                                  key={block.id}
                                />
                              );
                            })}
                          </SortableContext>
                        </BlockDroppableContainer>
                      </Item>
                    );
                  })}
                </SortableContext>
              </CardDroppableContainer>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeItem ? (
          <Item item={activeItem}>
            <BlockDroppableContainer cardId={activeItem.id}>
              {activeItem.blocks.map((blocks) => (
                <Block block={blocks} key={blocks.id} />
              ))}
            </BlockDroppableContainer>
          </Item>
        ) : activeBlock ? (
          <Block block={activeBlock} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const Block = ({ block, container }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: "block",
      container: container,
    },
  });
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: "lightblue",
    textAlign: "center",
    padding: 5,
    marginTop: 5,
    marginBottom: 5,
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      {block.text}
    </div>
  );
};

const CardDroppableContainer = ({ container, children }) => {
  const { setNodeRef } = useDroppable({
    id: container,
    data: {
      accepts: "card",
    },
  });
  return (
    <div
      style={{
        background: "green",
        display: "flex",
        flexDirection: "column",
        padding: 20,
        margin: 10,
      }}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

const BlockDroppableContainer = ({ cardId, children }) => {
  const { setNodeRef } = useDroppable({
    id: cardId,
    data: {
      accepts: "block",
    },
  });
  return (
    <div style={{ backgroundColor: "red", padding: 10 }} ref={setNodeRef}>
      {children}
    </div>
  );
};

export default NestedList;
