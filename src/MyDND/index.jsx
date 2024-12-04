import { useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { initData } from "./data";

import ActivityItem from "./ActivityItem";
import ProcessDroppableContainer from "./ProcessDroppableContainer";
import SubProcessDraggableItem from "./SubProcessDraggableItem";
import SubProcessDroppableContainer from "./SubProcessDroppableContainer";

const MyDND = () => {
  const [data, setData] = useState(initData);
  // const [clonedData, setClonedData] = useState(null);
  const [activeSubProcess, setActiveSubProcess] = useState();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragStart = ({ active }) => {
    if (active.data.current.type === "subprocess") {
      const container = findProcessContainerBySubProcessId(active.id);
      const _activeSubProcess = container?.subs?.find(
        (sub) => sub.id === active.id,
      );
      setActiveSubProcess(_activeSubProcess);
    }
  };

  // const onDragEnd = ({ active, over }) => {};

  const onDragCancel = () => {
    setActiveSubProcess(null);
  };

  const findProcessContainerBySubProcessId = (subProcessId) => {
    for (const process of data) {
      // not able to move process to single process 1
      if (subProcessId === "single") return null;

      // when process container is empty subprocessId turn to be process id
      if (subProcessId === process.id) return process;

      const matchingSubProcess = process?.subs?.find(
        (sub) => sub.id === subProcessId,
      );

      if (matchingSubProcess) return process;
    }

    return null;
  };

  const onDragOver = ({ active, over }) => {
    const overId = over?.id;
    const activeId = active?.id;

    if (overId == null || activeId == null) return;

    console.log("Drag Over: ", { active, over });

    if (active.data.current.type === "subprocess") {
      const overContainer = findProcessContainerBySubProcessId(overId);
      const activeContainer = findProcessContainerBySubProcessId(activeId);

      console.log("Drag Over: ", { overContainer, activeContainer });

      if (!overContainer || !activeContainer) {
        console.log("Drag Over: ", "No container found");
        return;
      }

      if (activeContainer !== overContainer) {
        setData((prevData) => {
          const clonedData = [...prevData];

          // Find indices of containers in the cloned data
          const overContainerIndex = clonedData.findIndex(
            (item) => item.id === overContainer.id,
          );
          const activeContainerIndex = clonedData.findIndex(
            (item) => item.id === activeContainer.id,
          );

          if (overContainerIndex === -1 || activeContainerIndex === -1) {
            console.log("Drag Over: ", "Container indices not found");
            return prevData; // Return the original data to avoid breaking state
          }

          // Get references to `subs` for both containers
          const activeSubProcessItems =
            clonedData[activeContainerIndex].subs || [];
          const overSubProcessItems = clonedData[overContainerIndex].subs || [];

          // Find the indices of the active and over subprocesses
          const activeIndex = activeSubProcessItems.findIndex(
            (item) => item.id === activeId,
          );
          const overIndex = overSubProcessItems.findIndex(
            (item) => item.id === overId,
          );

          if (activeIndex === -1) {
            console.log(
              "Drag Over: ",
              "Active subprocess not found in its container",
            );
            return prevData;
          }

          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height;
          const modifier = isBelowOverItem ? 1 : 0;
          const newIndex =
            overIndex >= 0 ? overIndex + modifier : overSubProcessItems.length; // Place at the end if not found

          // Remove the active subprocess from its current container
          const [activeSubProcess] = activeSubProcessItems.splice(
            activeIndex,
            1,
          );

          // Add the active subprocess to the new container at the calculated index
          clonedData[overContainerIndex].subs = [
            ...overSubProcessItems.slice(0, newIndex),
            activeSubProcess,
            ...overSubProcessItems.slice(newIndex, overSubProcessItems.length),
          ];

          // Update the subs of the active container
          clonedData[activeContainerIndex].subs = activeSubProcessItems;

          return clonedData;
        });
      }
    }
  };

  const onDragEnd = ({ active, over }) => {
    const activeId = active.id;
    if (active.data.current.type === "subprocess") {
      const activeContainer = findProcessContainerBySubProcessId(activeId);

      if (!activeContainer) {
        setActiveSubProcess(null);
        return;
      }

      const overId = over?.id;

      if (overId == null) {
        setActiveSubProcess(null);
        return;
      }

      const overContainer = findProcessContainerBySubProcessId(overId);

      if (overContainer) {
        const clonedData = [...data];

        // Find indices of containers in the cloned data
        const overContainerIndex = clonedData.findIndex(
          (item) => item.id === overContainer.id,
        );
        const activeContainerIndex = clonedData.findIndex(
          (item) => item.id === activeContainer.id,
        );

        if (overContainerIndex === -1 || activeContainerIndex === -1) {
          console.log("Drag End: ", "Container indices not found");
          return; // Return the original data to avoid breaking state
        }

        // Get references to `subs` for both containers
        const activeSubProcessItems =
          clonedData[activeContainerIndex].subs || [];
        const overSubProcessItems = clonedData[overContainerIndex].subs || [];

        // Find the indices of the active and over subprocesses
        const activeIndex = activeSubProcessItems.findIndex(
          (item) => item.id === activeId,
        );
        const overIndex = overSubProcessItems.findIndex(
          (item) => item.id === overId,
        );

        if (activeIndex !== overIndex) {
          clonedData[overContainerIndex].subs = arrayMove(
            overSubProcessItems,
            activeIndex,
            overIndex,
          );

          setData(clonedData);
        }
      }
    }

    setActiveSubProcess(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      // measuring={{
      //   droppable: {
      //     strategy: MeasuringStrategy.Always,
      //   },
      // }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="p-8 flex flex-col gap-3">
        {data.map((process) => (
          <ProcessDroppableContainer key={process.id} processId={process.id}>
            <h1 className="font-bold text-white text-xl">{process.name}</h1>

            {/* <SortableContext
              strategy={verticalListSortingStrategy}
              items={getAllActivityIds}
            >
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left w-1/2">ID</th>
                    <th className="text-left">Name</th>
                  </tr>
                </thead>

                {process?.activities?.length > 0 && (
                  <tbody>
                    {process.activities?.map((activity) => (
                      <ActivityItem key={activity?.id} data={activity} />
                    ))}
                  </tbody>
                )}
              </table>
            </SortableContext> */}

            <SortableContext
              strategy={verticalListSortingStrategy}
              items={process?.subs?.map((s) => s.id)}
            >
              <div className="flex flex-col gap-3 mt-3">
                {process?.subs?.map((s) => (
                  <SubProcessDraggableItem subprocessId={s.id} key={s.id}>
                    <SubProcessDroppableContainer subprocessId={s.id}>
                      <h2 className="text-lg font-semibold text-white">
                        {s.name}
                      </h2>

                      <table className="w-full">
                        <thead>
                          <tr className="text-white text-sm font-semibold bg-[#1B2150]">
                            <th className="text-left w-1/2 p-3">ID</th>
                            <th className="text-left">Name</th>
                          </tr>
                        </thead>

                        <SortableContext
                          strategy={verticalListSortingStrategy}
                          items={s.activities.map((a) => a.id)}
                        >
                          <tbody>
                            {s.activities?.map((activity) => (
                              <ActivityItem
                                key={activity?.id}
                                data={activity}
                                processId={process.id}
                              />
                            ))}
                          </tbody>
                        </SortableContext>
                      </table>
                    </SubProcessDroppableContainer>
                  </SubProcessDraggableItem>
                ))}
              </div>
            </SortableContext>
          </ProcessDroppableContainer>
        ))}
      </div>

      <DragOverlay>
        {activeSubProcess ? (
          <SubProcessDraggableItem subprocessId={activeSubProcess.id}>
            <SubProcessDroppableContainer subprocessId={activeSubProcess.id}>
              <h2 className="text-lg font-semibold text-white">
                {activeSubProcess.name}
              </h2>

              <table className="w-full">
                <thead>
                  <tr className="text-white text-sm font-semibold bg-[#1B2150]">
                    <th className="text-left w-1/2 p-3">ID</th>
                    <th className="text-left">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSubProcess.activities?.map((activity) => (
                    <ActivityItem
                      key={activity?.id}
                      data={activity}
                      // processId={process.id}
                    />
                  ))}
                </tbody>
              </table>
            </SubProcessDroppableContainer>
          </SubProcessDraggableItem>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default MyDND;
