import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
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
        // when activity id turn to be sub process id, return the sub process only container if activity list is empty
        if (sub?.activities.length === 0 && activityId === sub.id) return sub;

        const matchingActivity = sub?.activities?.find((act) => act.id === activityId);

        if (matchingActivity) return sub;
      }
    }

    return null;
  };

  const findProcessContainerByActivityId = (activityId) => {
    for (const process of data) {
      // when process container is empty activityId turn to be process id
      if (activityId === process.id) return process;

      const matchingActivity = process?.activities?.find((act) => act.id === activityId);

      if (matchingActivity) return process;

      for (const sub of process.subs) {
        if (sub.id === activityId) return process;

        const matchingActivity = sub?.activities?.find((act) => act.id === activityId);

        if (matchingActivity) return process;
      }
    }

    return null;
  };

  const findNewIndex = ({ over, active, overIndex, lastIndex }) => {
    const isBelowOverItem =
      over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
    const modifier = isBelowOverItem ? 1 : 0;

    return overIndex >= 0 ? overIndex + modifier : lastIndex;
  };

  const handleDragOverSubProcess = ({ active, over }) => {
    const overId = over?.id;
    const activeId = active?.id;

    const overContainer = findProcessContainerBySubProcessId(overId);
    const activeContainer = findProcessContainerBySubProcessId(activeId);

    if (!overContainer || !activeContainer) {
      return;
    }

    if (activeContainer !== overContainer) {
      const clonedData = [...data];
      // Find indices of containers in the cloned data
      const overContainerIndex = clonedData.findIndex((item) => item.id === overContainer.id);
      const activeContainerIndex = clonedData.findIndex((item) => item.id === activeContainer.id);

      if (overContainerIndex === -1 || activeContainerIndex === -1) {
        return;
      }

      // Get references to `subs` for both containers
      const activeSubProcessItems = clonedData[activeContainerIndex].subs || [];
      const overSubProcessItems = clonedData[overContainerIndex].subs || [];

      // Find the indices of the active and over subprocesses
      const activeIndex = activeSubProcessItems.findIndex((item) => item.id === activeId);
      const overIndex = overSubProcessItems.findIndex((item) => item.id === overId);

      // Active subprocess not found in its container
      if (activeIndex === -1) {
        return;
      }

      const lastIndex = overSubProcessItems.length;
      const newIndex = findNewIndex({ over, active, overIndex, lastIndex });

      const [activeSubProcess] = activeSubProcessItems.splice(activeIndex, 1);
      clonedData[overContainerIndex].subs = [
        ...overSubProcessItems.slice(0, newIndex),
        activeSubProcess,
        ...overSubProcessItems.slice(newIndex, lastIndex),
      ];

      clonedData[activeContainerIndex].subs = activeSubProcessItems;

      setData(clonedData);
    }
  };

  const handleDragOverActivityFromSubProcessToSubProcess = ({
    active,
    over,
    overSubprocessContainer,
    activeSubprocessContainer,
  }) => {
    const overId = over?.id;
    const activeId = active?.id;

    const activeProcessContainerId = active.data.current.processContainerId;
    const overProcessContainerId = over.data.current.processContainerId;

    if (!activeProcessContainerId || !overProcessContainerId) {
      return;
    }

    if (overSubprocessContainer !== activeSubprocessContainer) {
      const activeActivityItems = activeSubprocessContainer?.activities || [];
      const overActivityItems = overSubprocessContainer?.activities || [];

      const activeIndex = activeActivityItems.findIndex((item) => item.id === activeId);
      const overIndex = overActivityItems.findIndex((item) => item.id === overId);

      if (activeIndex === -1) {
        return;
      }

      const lastIndex = overActivityItems.length;
      const newIndex = findNewIndex({ over, active, overIndex, lastIndex });

      const [activeActivity] = activeActivityItems.splice(activeIndex, 1);
      const newOverActivityItems = [
        ...overActivityItems.slice(0, newIndex),
        activeActivity,
        ...overActivityItems.slice(newIndex, lastIndex),
      ];

      const clonedData = [...data];
      const newData = clonedData.map((process) => {
        if (process.id === activeProcessContainerId) {
          process = {
            ...process,
            subs: process.subs.map((sub) =>
              sub.id === activeSubprocessContainer.id ? { ...sub, activities: activeActivityItems } : sub
            ),
          };
        }
        if (process.id === overProcessContainerId) {
          process = {
            ...process,
            subs: process.subs.map((sub) =>
              sub.id === overSubprocessContainer.id ? { ...sub, activities: newOverActivityItems } : sub
            ),
          };
        }
        return process;
      });
      setData(newData);
    }
  };

  const handleDragOverActivityFromProcessToSubProcess = ({
    active,
    over,
    activeProcessContainer,
    overSubprocessContainer,
  }) => {
    const overId = over?.id;
    const activeId = active?.id;

    let overProcessContainerId = over.data.current.processContainerId;

    if (!overProcessContainerId) {
      const findOverProcessContainer = findProcessContainerBySubProcessId(overSubprocessContainer.id);
      overProcessContainerId = findOverProcessContainer.id;
    }

    const activeActivityItems = activeProcessContainer?.activities || [];
    const overActivityItems = overSubprocessContainer?.activities || [];

    const activeIndex = activeActivityItems.findIndex((item) => item.id === activeId);
    const overIndex = overActivityItems.findIndex((item) => item.id === overId);

    if (activeIndex === -1) {
      return;
    }

    const lastIndex = overActivityItems.length;
    const newIndex = findNewIndex({ over, active, overIndex, lastIndex });

    const [activeActivity] = activeActivityItems.splice(activeIndex, 1);
    const newOverActivityItems = [
      ...overActivityItems.slice(0, newIndex),
      activeActivity,
      ...overActivityItems.slice(newIndex, lastIndex),
    ];

    const clonedData = [...data];
    const newData = clonedData.map((process) => {
      if (process.id === activeProcessContainer.id) {
        process = {
          ...process,
          activities: activeActivityItems,
        };
      }
      if (process.id === overProcessContainerId) {
        process = {
          ...process,
          subs: process.subs.map((sub) =>
            sub.id === overSubprocessContainer.id ? { ...sub, activities: newOverActivityItems } : sub
          ),
        };
      }
      return process;
    });

    setData(newData);
  };

  const handleDragOverActivityFromSubProcessToProcess = ({
    active,
    over,
    activeSubprocessContainer,
    overProcessContainer,
  }) => {
    const overId = over?.id;
    const activeId = active?.id;

    const activeProcessContainerId = active.data.current.processContainerId;

    const activeActivityItems = activeSubprocessContainer?.activities || [];
    const overActivityItems = overProcessContainer?.activities || [];

    const activeIndex = activeActivityItems.findIndex((item) => item.id === activeId);
    const overIndex = overActivityItems.findIndex((item) => item.id === overId);

    if (activeIndex === -1) {
      return;
    }

    const lastIndex = overActivityItems.length;
    const newIndex = findNewIndex({ over, active, overIndex, lastIndex });

    const [activeActivity] = activeActivityItems.splice(activeIndex, 1);
    const newOverActivityItems = [
      ...overActivityItems.slice(0, newIndex),
      activeActivity,
      ...overActivityItems.slice(newIndex, lastIndex),
    ];

    const clonedData = [...data];

    const newData = clonedData.map((process) => {
      if (process.id === activeProcessContainerId) {
        process = {
          ...process,
          subs: process.subs.map((sub) =>
            sub.id === activeSubprocessContainer.id ? { ...sub, activities: activeActivityItems } : sub
          ),
        };
      }
      if (process.id === overProcessContainer.id) {
        process = {
          ...process,
          activities: newOverActivityItems,
        };
      }
      return process;
    });

    setData(newData);
  };

  const handleDragOverActivityFromProcessToProcess = ({
    over,
    active,
    overProcessContainer,
    activeProcessContainer,
  }) => {
    console.log('Act of Process ==> Process: ', {
      over,
      active,
      overProcessContainer,
      activeProcessContainer,
    });

    const overId = over?.id;
    const activeId = active?.id;
    const activeActivityItems = activeProcessContainer?.activities || [];
    const overActivityItems = overProcessContainer?.activities || [];

    const activeIndex = activeActivityItems.findIndex((item) => item.id === activeId);
    const overIndex = overActivityItems.findIndex((item) => item.id === overId);

    if (activeIndex === -1) {
      console.log(
        'Drag Over: ',
        'Active Activity not found in its process container (scope process to process)' + overIndex
      );
      return;
    }

    const lastIndex = overActivityItems.length;
    const newIndex = findNewIndex({ over, active, overIndex, lastIndex });

    const [activeActivity] = activeActivityItems.splice(activeIndex, 1);
    const newOverActivityItems = [
      ...overActivityItems.slice(0, newIndex),
      activeActivity,
      ...overActivityItems.slice(newIndex, lastIndex),
    ];

    setData((prevData) => {
      const clonedData = [...prevData];

      const newData = clonedData.map((process) => {
        if (process.id === activeProcessContainer.id) {
          process = {
            ...process,
            activities: activeActivityItems,
          };
        }
        if (process.id === overProcessContainer.id) {
          process = {
            ...process,
            activities: newOverActivityItems,
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
    const overProcessContainer = findProcessContainerByActivityId(over?.id);
    const activeProcessContainer = findProcessContainerByActivityId(active?.id);

    if (overSubprocessContainer && activeSubprocessContainer) {
      // Drag the activity from subprocess to drop in another subprocess
      handleDragOverActivityFromSubProcessToSubProcess({
        active,
        over,
        overSubprocessContainer,
        activeSubprocessContainer,
      });
    } else if (activeProcessContainer && overSubprocessContainer) {
      // Drag the activity from process to drop in subprocess
      handleDragOverActivityFromProcessToSubProcess({ active, over, activeProcessContainer, overSubprocessContainer });
    } else if (activeSubprocessContainer && overProcessContainer) {
      // Drag the activity from subprocess to drop in process
      handleDragOverActivityFromSubProcessToProcess({
        active,
        over,
        activeSubprocessContainer,
        overProcessContainer,
      });
    } else if (activeProcessContainer && overProcessContainer) {
      // Drag the activity from process to drop in another process
      handleDragOverActivityFromProcessToProcess({
        active,
        over,
        activeProcessContainer,
        overProcessContainer,
      });
    }
  };

  const onDragOver = ({ active, over }) => {
    if (over?.id == null || active?.id == null) return;

    if (active.data.current.type === 'subprocess') {
      // Drag the subprocess to drop in different process container
      handleDragOverSubProcess({ active, over });
    } else if (active.data.current.type === 'activity') {
      handleDragOverActivity({ active, over });
    }
  };

  const handleDragEndSubProcess = ({ active, over }) => {
    const activeId = active.id;
    const activeContainer = findProcessContainerBySubProcessId(activeId);

    if (!activeContainer || !over?.id) {
      setActiveSubProcess(null);
      return;
    }

    const overId = over?.id;
    const overContainer = findProcessContainerBySubProcessId(overId);

    if (overContainer) {
      const clonedData = [...data];

      // Find indices of process containers
      const overContainerIndex = clonedData.findIndex((item) => item.id === overContainer.id);
      const activeContainerIndex = clonedData.findIndex((item) => item.id === activeContainer.id);

      if (overContainerIndex === -1 || activeContainerIndex === -1) {
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
    const overProcessContainer = findProcessContainerByActivityId(overId);

    if (overSubProcessContainer && activeSubProcessContainer) {
      // Re-order the activity in the same subprocess container
      const clonedData = [...data];
      const overProcessContainerId = over.data.current.processContainerId;

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
    } else if (activeProcessContainer && overProcessContainer) {
      // Re-order the activity in the same process container
      const clonedData = [...data];
      const overProcessContainerId = overProcessContainer.id;

      const activeActivityItems = activeProcessContainer?.activities || [];
      const overActivityItems = overProcessContainer?.activities || [];

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
      // Re-order the subprocess in the same container
      handleDragEndSubProcess({ active, over });
    } else if (active.data.current.type === 'activity') {
      // Re-order the activity in the same container
      handleDragEndActivity({ active, over });
    }
    setActiveSubProcess(null);
    setActiveActivity(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className='p-8 flex flex-col gap-3'>
        {data.map((process) => (
          <ProcessDroppableContainer key={process.id} processId={process.id}>
            <h1 className='font-bold text-white text-xl'>{process.name}</h1>

            <table className='w-full'>
              <thead>
                <tr className='text-white text-sm font-semibold bg-[#1B2150]'>
                  <th className='text-left w-1/2 p-3'>ID</th>
                  <th className='text-left'>Name</th>
                </tr>
              </thead>

              <SortableContext strategy={verticalListSortingStrategy} items={process.activities?.map((a) => a.id)}>
                {process?.activities?.length > 0 && (
                  <tbody>
                    {process.activities?.map((activity) => (
                      <ActivityItem key={activity?.id} data={activity} />
                    ))}
                  </tbody>
                )}
              </SortableContext>
            </table>

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
