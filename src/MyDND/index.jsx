import { useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { initData } from './data';

import ActivityItem from './ActivityItem';
import ProcessDroppableContainer from './ProcessDroppableContainer';
import SubProcessDraggableItem from './SubProcessDraggableItem';
import SubProcessDroppableContainer from './SubProcessDroppableContainer';

const MyDND = () => {
  const [data, setData] = useState(initData);
  const [activeSubProcess, setActiveSubProcess] = useState();
  const [activeActivity, setActiveActivity] = useState();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = ({ active }) => {
    if (active.data.current.type === 'subprocess') {
      const container = findProcessContainerBySubProcessId(active.id);
      const _activeSubProcess = container?.subs?.find((sub) => sub.id === active.id);
      setActiveSubProcess(_activeSubProcess);
    }
    if (active.data.current.type === 'activity') {
      for (const process of data) {
        const _activeActivity = process?.activities?.find((act) => act.id === active.id);
          if (_activeActivity) {
            setActiveActivity(_activeActivity);
            return;
          }

        for (const sub of process.subs) {
          const _activeActivity = sub?.activities?.find((act) => act.id === active.id);
          if (_activeActivity) {
            setActiveActivity(_activeActivity);
            return;
          }
        }
      }
    }
  };

  const onDragCancel = () => {
    setActiveSubProcess(null);
    setActiveActivity(null);
  };

  const findProcessContainerBySubProcessId = (subProcessId) => {
    for (const process of data) {
      // not able to move process to single process
      if (subProcessId === 'single') return null;

      // when process container is empty subprocessId turn to be process id
      if (subProcessId === process.id) return process;

      const matchingSubProcess = process?.subs?.find((sub) => sub.id === subProcessId);

      if (matchingSubProcess) return process;
    }

    return null;
  };

  const findSubProcessContainerByActivityId = (activityId) => {
    for (const process of data) {
      for (const sub of process.subs) {
        if (activityId === sub.id) return sub;

        const matchingActivity = sub?.activities?.find((act) => act.id === activityId);

        if (matchingActivity) return sub;
      }
    }

    return null;
  };

  const findProcessContainerByActivityId = (activityId) => {
    for (const process of data) {
      if (activityId === process.id) return process;

      const matchingActivity = process?.activities?.find((act) => act.id === activityId);

      if (matchingActivity) return process;
    }

    return null;
  };

  const handleDragOverSubProcess = ({ active, over }) => {
    const overId = over?.id;
    const activeId = active?.id;

    // if the draggable type is subprocess move the subprocess to the new process container
    const overContainer = findProcessContainerBySubProcessId(overId);
    const activeContainer = findProcessContainerBySubProcessId(activeId);

    console.log('Drag Over: ', { overContainer, activeContainer });

    if (!overContainer || !activeContainer) {
      console.log('Drag Over: ', 'No container found');
      return;
    }

    if (activeContainer !== overContainer) {
      setData((prevData) => {
        const clonedData = [...prevData];

        // Find indices of containers in the cloned data
        const overContainerIndex = clonedData.findIndex((item) => item.id === overContainer.id);
        const activeContainerIndex = clonedData.findIndex((item) => item.id === activeContainer.id);

        if (overContainerIndex === -1 || activeContainerIndex === -1) {
          console.log('Drag Over: ', 'Container indices not found');
          return prevData; // Return the original data to avoid breaking state
        }

        // Get references to `subs` for both containers
        const activeSubProcessItems = clonedData[activeContainerIndex].subs || [];
        const overSubProcessItems = clonedData[overContainerIndex].subs || [];

        // Find the indices of the active and over subprocesses
        const activeIndex = activeSubProcessItems.findIndex((item) => item.id === activeId);
        const overIndex = overSubProcessItems.findIndex((item) => item.id === overId);

        if (activeIndex === -1) {
          console.log('Drag Over: ', 'Active subprocess not found in its container');
          return prevData;
        }

        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        const newIndex = overIndex >= 0 ? overIndex + modifier : overSubProcessItems.length; // Place at the end if not found

        // Remove the active subprocess from its current container
        const [activeSubProcess] = activeSubProcessItems.splice(activeIndex, 1);

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
  };

  const handleDragOverActivityFromSubProcessToSubProcess = ({
    active,
    over,
    overSubprocessContainer,
    activeSubprocessContainer,
  }) => {
    console.log('Act of Sub Process ==> Sub Process: ', {
      active,
      over,
      activeSubprocessContainer,
      overSubprocessContainer,
    });
    const overId = over?.id;
    const activeId = active?.id;

    const activeProcessContainer = active.data.current.processContainer;
    let overProcessContainer = over.data.current.processContainer;

    if (!activeProcessContainer) {
      console.log('Drag Over: ', 'No active process container found');
      return;
    }

    if (!overProcessContainer) {
      const findOverProcessContainer = findProcessContainerBySubProcessId(overSubprocessContainer.id);

      if (!findOverProcessContainer) {
        console.log('Drag Over: ', 'No over process container found');
      }

      overProcessContainer = findOverProcessContainer.id;
    }

    console.log({ activeProcessContainer, overProcessContainer });

    if (overSubprocessContainer !== activeSubprocessContainer) {
      setData((prevData) => {
        const activeActivityItems = activeSubprocessContainer?.activities || [];
        const overActivityItems = overSubprocessContainer?.activities || [];

        console.log({ activeActivityItems, overActivityItems });

        const activeIndex = activeActivityItems.findIndex((item) => item.id === activeId);
        const overIndex = overActivityItems.findIndex((item) => item.id === overId);

        console.log({ activeIndex, overIndex });

        if (activeIndex === -1) {
          console.log('Drag Over: ', 'Active Activity not found in its subprocess container');
          return prevData;
        }

        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        const newIndex = overIndex >= 0 ? overIndex + modifier : overActivityItems.length;

        const [activeActivity] = activeActivityItems.splice(activeIndex, 1);
        const newOverActivityItems = [
          ...overActivityItems.slice(0, newIndex),
          activeActivity,
          ...overActivityItems.slice(newIndex, overActivityItems.length),
        ];

        console.log({
          activeActivityItems,
          activeActivity,
          newOverActivityItems,
        });

        const clonedData = [...prevData];

        const newData = clonedData.map((process) => {
          if (process.id === activeProcessContainer) {
            process = {
              ...process,
              subs: process.subs.map((sub) =>
                sub.id === activeSubprocessContainer.id ? { ...sub, activities: activeActivityItems } : sub
              ),
            };
          }
          if (process.id === overProcessContainer) {
            process = {
              ...process,
              subs: process.subs.map((sub) =>
                sub.id === overSubprocessContainer.id ? { ...sub, activities: newOverActivityItems } : sub
              ),
            };
          }
          return process;
        });

        return newData;
      });
    }
  };

  const handleDragOverActivityFromProcessToSubProcess = ({
    active,
    over,
    activeProcessContainer,
    overSubprocessContainer,
  }) => {
    console.log('Act of Process ==> Sub Process: ', {
      active,
      over,
      activeProcessContainer,
      overSubprocessContainer,
    });
    const overId = over?.id;
    const activeId = active?.id;

    let overProcessContainer = over.data.current.processContainer;

    if (!overProcessContainer) {
      const findOverProcessContainer = findProcessContainerBySubProcessId(overSubprocessContainer.id);

      if (!findOverProcessContainer) {
        console.log('Drag Over: ', 'No over process container found');
      }

      overProcessContainer = findOverProcessContainer.id;
    }

    setData((prevData) => {
      const activeActivityItems = activeProcessContainer?.activities || [];
      const overActivityItems = overSubprocessContainer?.activities || [];

      const activeIndex = activeActivityItems.findIndex((item) => item.id === activeId);
      const overIndex = overActivityItems.findIndex((item) => item.id === overId);

      if (activeIndex === -1) {
        console.log('Drag Over: ', 'Active Activity not found in its process container');
        return prevData;
      }

      const isBelowOverItem =
        over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
      const modifier = isBelowOverItem ? 1 : 0;
      const newIndex = overIndex >= 0 ? overIndex + modifier : overActivityItems.length;

      const [activeActivity] = activeActivityItems.splice(activeIndex, 1);
      const newOverActivityItems = [
        ...overActivityItems.slice(0, newIndex),
        activeActivity,
        ...overActivityItems.slice(newIndex, overActivityItems.length),
      ];

      const clonedData = [...prevData];

      const newData = clonedData.map((process) => {
        if (process.id === overProcessContainer) {
          process = {
            ...process,
            subs: process.subs.map((sub) =>
              sub.id === overSubprocessContainer.id ? { ...sub, activities: newOverActivityItems } : sub
            ),
          };
        }
        return process;
      });

      return newData;
    });
  };

  const handleDragOverActivity = ({ active, over }) => {
    const overSubprocessContainer = findSubProcessContainerByActivityId(over?.id);
    const activeSubprocessContainer = findSubProcessContainerByActivityId(active?.id);
    // const overProcessContainer = findProcessContainerByActivityId(over?.id);
    const activeProcessContainer = findProcessContainerByActivityId(active?.id);

    console.log({ overSubprocessContainer, activeSubprocessContainer });

    if (overSubprocessContainer && activeSubprocessContainer) {
      handleDragOverActivityFromSubProcessToSubProcess({
        active,
        over,
        overSubprocessContainer,
        activeSubprocessContainer,
      });
    } else if (activeProcessContainer && overSubprocessContainer) {
      handleDragOverActivityFromProcessToSubProcess({ active, over, activeProcessContainer, overSubprocessContainer });
    }
  };

  const onDragOver = ({ active, over }) => {
    if (over?.id == null || active?.id == null) return;

    console.log('Drag Over: ', { active, over });

    if (active.data.current.type === 'subprocess') {
      handleDragOverSubProcess({ active, over });
    } else if (active.data.current.type === 'activity') {
      handleDragOverActivity({ active, over });
    }
  };

  const handleDragEndSubProcess = ({ active, over }) => {
    const activeId = active.id;
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
      const overContainerIndex = clonedData.findIndex((item) => item.id === overContainer.id);
      const activeContainerIndex = clonedData.findIndex((item) => item.id === activeContainer.id);

      if (overContainerIndex === -1 || activeContainerIndex === -1) {
        console.log('Drag End: ', 'Container indices not found');
        return; // Return the original data to avoid breaking state
      }

      // Get references to `subs` for both containers
      const activeSubProcessItems = clonedData[activeContainerIndex].subs || [];
      const overSubProcessItems = clonedData[overContainerIndex].subs || [];

      // Find the indices of the active and over subprocesses
      const activeIndex = activeSubProcessItems.findIndex((item) => item.id === activeId);
      const overIndex = overSubProcessItems.findIndex((item) => item.id === overId);

      if (activeIndex !== overIndex) {
        clonedData[overContainerIndex].subs = arrayMove(overSubProcessItems, activeIndex, overIndex);

        setData(clonedData);
      }
    }
  };

  const handleDragEndActivity = ({ active, over }) => {
    const activeId = active?.id;
    const overId = over?.id;
    if (overId == null) {
      setActiveActivity(null);
      return;
    }

    const activeSubProcessContainer = findSubProcessContainerByActivityId(activeId);
    const overSubProcessContainer = findSubProcessContainerByActivityId(overId);
    const activeProcessContainer = findProcessContainerByActivityId(activeId);
    // const overProcessContainer = findProcessContainerByActivityId(overId);

    if (overSubProcessContainer && activeSubProcessContainer) {
      // move activity from one sub process to another sub process
      const clonedData = [...data];
      const overProcessContainerId = over.data.current.processContainer;

      const activeActivityItems = activeSubProcessContainer?.activities || [];
      const overActivityItems = overSubProcessContainer?.activities || [];

      const activeIndex = activeActivityItems.findIndex((item) => item.id === activeId);
      const overIndex = overActivityItems.findIndex((item) => item.id === overId);

      if (activeIndex !== overIndex) {
        const newData = clonedData.map((process) => {
          if (process.id === overProcessContainerId) {
            process = {
              ...process,
              subs: process.subs.map((sub) =>
                sub.id === overSubProcessContainer.id
                  ? {
                      ...sub,
                      activities: arrayMove(overActivityItems, activeIndex, overIndex),
                    }
                  : sub
              ),
            };
          }
          return process;
        });

        setData(newData);
      }
    } else if (activeProcessContainer && overSubProcessContainer) {
      // move activity from process to sub process
      const clonedData = [...data];
      const overProcessContainerId = over.data.current.processContainer;

      const activeActivityItems = activeProcessContainer?.activities || [];
      const overActivityItems = overSubProcessContainer?.activities || [];

      const activeIndex = activeActivityItems.findIndex((item) => item.id === activeId);
      const overIndex = overActivityItems.findIndex((item) => item.id === overId);

      if (activeIndex !== overIndex) {
        const newData = clonedData.map((process) => {
          if (process.id === overProcessContainerId) {
            process = {
              ...process,
              activities: arrayMove(overActivityItems, activeIndex, overIndex),
            };
          }
          return process;
        });

        setData(newData);
      }
    }
  };

  const onDragEnd = ({ active, over }) => {
    if (active.data.current.type === 'subprocess') {
      handleDragEndSubProcess({ active, over });
    } else if (active.data.current.type === 'activity') {
      console.log('Activity Drag End');
      handleDragEndActivity({ active, over });
    }
    setActiveSubProcess(null);
    setActiveActivity(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className='p-8 flex flex-col gap-3'>
        {data.map((process) => (
          <ProcessDroppableContainer key={process.id} processId={process.id}>
            <h1 className='font-bold text-white text-xl'>{process.name}</h1>

            <SortableContext strategy={verticalListSortingStrategy} items={process.activities?.map((a) => a.id)}>
              <table className='w-full'>
                <thead>
                  <tr className='text-white text-sm font-semibold bg-[#1B2150]'>
                    <th className='text-left w-1/2 p-3'>ID</th>
                    <th className='text-left'>Name</th>
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
            </SortableContext>

            <SortableContext strategy={verticalListSortingStrategy} items={process?.subs?.map((s) => s.id)}>
              <div className='flex flex-col gap-3 mt-3'>
                {process?.subs?.map((s) => (
                  <SubProcessDraggableItem subprocessId={s.id} key={s.id}>
                    <SubProcessDroppableContainer subprocessId={s.id}>
                      <h2 className='text-lg font-semibold text-white'>{s.name}</h2>

                      <table className='w-full'>
                        <thead>
                          <tr className='text-white text-sm font-semibold bg-[#1B2150]'>
                            <th className='text-left w-1/2 p-3'>ID</th>
                            <th className='text-left'>Name</th>
                          </tr>
                        </thead>

                        <SortableContext strategy={verticalListSortingStrategy} items={s.activities.map((a) => a.id)}>
                          <tbody>
                            {s.activities?.map((activity) => (
                              <ActivityItem key={activity?.id} data={activity} processId={process.id} />
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
              <h2 className='text-lg font-semibold text-white'>{activeSubProcess.name}</h2>

              <table className='w-full'>
                <thead>
                  <tr className='text-white text-sm font-semibold bg-[#1B2150]'>
                    <th className='text-left w-1/2 p-3'>ID</th>
                    <th className='text-left'>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSubProcess.activities?.map((activity) => (
                    <ActivityItem key={activity?.id} data={activity} />
                  ))}
                </tbody>
              </table>
            </SubProcessDroppableContainer>
          </SubProcessDraggableItem>
        ) : null}
        {activeActivity ? (
          <table className='w-full'>
            <tbody>
              <ActivityItem data={activeActivity} />
            </tbody>
          </table>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default MyDND;
