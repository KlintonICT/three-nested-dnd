import { useEffect, useState } from 'react';
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
import clsx from 'clsx';

import ProcessDraggableItem from './ProcessDraggableItem';
import ProcessDroppableContainer from './ProcessDroppableContainer';
import SubProcessDraggableItem from './SubProcessDraggableItem';
import SubProcessDroppableContainer from './SubProcessDroppableContainer';
import Table from './Table';

import { initData } from './data';

const ActivityTable = ({ activities, processId = '' }) => (
  <Table>
    <SortableContext strategy={verticalListSortingStrategy} items={activities.map((a) => a.id)}>
      <Table.Body>
        {activities?.map((activity) => (
          <Table.RowItem key={activity?.id} data={activity} processId={processId} />
        ))}
      </Table.Body>
    </SortableContext>
  </Table>
);

const SubProcessItem = ({ subprocess, processId = '' }) => (
  <SubProcessDraggableItem subprocessId={subprocess.id}>
    <SubProcessDroppableContainer subprocessId={subprocess.id}>
      <h2 className='text-lg font-semibold text-[#ABB2BF]'>{subprocess.name}</h2>
      <ActivityTable activities={subprocess.activities} processId={processId} />
    </SubProcessDroppableContainer>
  </SubProcessDraggableItem>
);

const ProcessItem = ({ process }) => (
  <ProcessDraggableItem processId={process.id}>
    <ProcessDroppableContainer processId={process.id}>
      <h1 className='font-bold text-[#ABB2BF] text-xl'>{process.name}</h1>
      <ActivityTable activities={process.activities} />
      <SortableContext strategy={verticalListSortingStrategy} items={process?.subs?.map((s) => s.id)}>
        <div className='flex flex-col gap-3 mt-3'>
          {process?.subs?.map((s) => (
            <SubProcessItem key={s.id} subprocess={s} processId={process.id} />
          ))}
        </div>
      </SortableContext>
    </ProcessDroppableContainer>
  </ProcessDraggableItem>
);

const MyDND = () => {
  const [data, setData] = useState(initData);
  const [clonedData, setClonedData] = useState(structuredClone(initData));
  const [isOrderChanged, setIsOrderChanged] = useState(false);

  const [activeActivity, setActiveActivity] = useState();
  const [activeSubProcess, setActiveSubProcess] = useState();
  const [activeProcess, setActiveProcess] = useState();

  useEffect(() => {
    setIsOrderChanged(JSON.stringify(clonedData) !== JSON.stringify(data));
  }, [clonedData, data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = ({ active }) => {
    const activeType = active.data.current.type;

    if (activeType === 'subprocess') {
      const container = findProcessContainerBySubProcessId(active.id);
      const _activeSubProcess = container?.subs?.find((sub) => sub.id === active.id);
      setActiveSubProcess(_activeSubProcess);
    } else if (activeType === 'activity') {
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
    } else if (activeType === 'process') {
      const _activeProcess = data.find((process) => process.id === active.id);
      setActiveProcess(_activeProcess);
    }
  };

  const onDragCancel = () => {
    setActiveProcess(null);
    setActiveSubProcess(null);
    setActiveActivity(null);
  };

  const findProcessContainerBySubProcessId = (subProcessId) => {
    // when subprocessId turn to be processId and have value=single, return null process container
    if (subProcessId === 'single') return null;

    for (const process of data) {
      if (subProcessId === process.id || process?.subs?.some((sub) => sub.id === subProcessId)) return process;
    }

    return null;
  };

  const findSubProcessContainerByActivityId = (activityId) => {
    for (const process of data) {
      for (const sub of process.subs) {
        // when activity id turn to be sub process id, return the sub process only container of activity list is empty
        const isFoundSubProcess = sub?.activities?.length === 0 && activityId === sub.id;
        if (isFoundSubProcess || sub?.activities?.some((act) => act.id === activityId)) return sub;
      }
    }

    return null;
  };

  const findProcessContainerByActivityId = (activityId) => {
    for (const process of data) {
      if (activityId === process.id || process?.activities?.some((act) => act.id === activityId)) return process;

      for (const sub of process.subs) {
        if (sub.id === activityId || sub?.activities?.some((act) => act.id === activityId)) return process;
      }
    }

    return null;
  };

  const findActiveAndOverIndex = ({ active, over, activeList, overList }) => {
    const activeIndex = activeList.findIndex((item) => item.id === active.id);
    const overIndex = overList.findIndex((item) => item.id === over?.id);

    return { activeIndex, overIndex };
  };

  const findActiveAndOverItems = ({ over, active, activeList, overList }) => {
    const { activeIndex, overIndex } = findActiveAndOverIndex({ active, over, activeList, overList });

    const lastIndex = overList.length;
    const isBelowOverItem =
      over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
    const modifier = isBelowOverItem ? 1 : 0;
    const newIndex = overIndex >= 0 ? overIndex + modifier : lastIndex;

    const [activeItem] = activeList.splice(activeIndex, 1);
    const newOverItems = [...overList.slice(0, newIndex), activeItem, ...overList.slice(newIndex, lastIndex)];

    return { activeList, overList: newOverItems };
  };

  const handleDragOverSubProcessFromProcessToProcess = ({ active, over }) => {
    const overContainer = findProcessContainerBySubProcessId(over?.id);
    const activeContainer = findProcessContainerBySubProcessId(active.id);

    if (!overContainer || !activeContainer) return;

    // make sure active and over process container is different
    if (activeContainer.id !== overContainer.id) {
      const activeAndOverItems = findActiveAndOverItems({
        over,
        active,
        activeList: activeContainer.subs || [],
        overList: overContainer.subs || [],
      });

      const newData = data.map((process) => {
        if (process.id === activeContainer.id) {
          return {
            ...process,
            subs: activeAndOverItems.activeList,
          };
        }
        if (process.id === overContainer.id) {
          return {
            ...process,
            subs: activeAndOverItems.overList,
          };
        }
        return process;
      });

      setData(newData);
    }
  };

  const handleDragOverActivityFromSubProcessToSubProcess = ({
    active,
    over,
    overSubprocessContainer,
    activeSubprocessContainer,
  }) => {
    const activeProcessContainerId = active.data.current.processContainerId;
    const overProcessContainerId = over.data.current.processContainerId;

    if (!activeProcessContainerId || !overProcessContainerId) return;

    // make sure active and over subprocess container is different
    if (overSubprocessContainer.id !== activeSubprocessContainer.id) {
      const activeOverItems = findActiveAndOverItems({
        active,
        over,
        activeList: activeSubprocessContainer?.activities || [],
        overList: overSubprocessContainer?.activities || [],
      });

      const newData = data.map((process) => {
        if (process.id === activeProcessContainerId) {
          process = {
            ...process,
            subs: process.subs.map((sub) =>
              sub.id === activeSubprocessContainer.id ? { ...sub, activities: activeOverItems.activeList } : sub
            ),
          };
        }
        if (process.id === overProcessContainerId) {
          process = {
            ...process,
            subs: process.subs.map((sub) =>
              sub.id === overSubprocessContainer.id ? { ...sub, activities: activeOverItems.overList } : sub
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
    let overProcessContainerId = over.data.current.processContainerId;
    if (!overProcessContainerId) {
      const findOverProcessContainer = findProcessContainerBySubProcessId(overSubprocessContainer.id);
      overProcessContainerId = findOverProcessContainer.id;
    }

    const activeOverItems = findActiveAndOverItems({
      active,
      over,
      activeList: activeProcessContainer?.activities || [],
      overList: overSubprocessContainer?.activities || [],
    });

    const newData = data.map((process) => {
      if (process.id === activeProcessContainer.id) {
        process = {
          ...process,
          activities: activeOverItems.activeList,
        };
      }
      if (process.id === overProcessContainerId) {
        process = {
          ...process,
          subs: process.subs.map((sub) =>
            sub.id === overSubprocessContainer.id ? { ...sub, activities: activeOverItems.overList } : sub
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
    const activeProcessContainerId = active.data.current.processContainerId;
    const activeOverItems = findActiveAndOverItems({
      active,
      over,
      activeList: activeSubprocessContainer?.activities || [],
      overList: overProcessContainer?.activities || [],
    });

    const newData = data.map((process) => {
      if (process.id === activeProcessContainerId) {
        process = {
          ...process,
          subs: process.subs.map((sub) =>
            sub.id === activeSubprocessContainer.id ? { ...sub, activities: activeOverItems.activeList } : sub
          ),
        };
      }
      if (process.id === overProcessContainer.id) {
        process = {
          ...process,
          activities: activeOverItems.overList,
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
    const activeOverItems = findActiveAndOverItems({
      active,
      over,
      activeList: activeProcessContainer?.activities || [],
      overList: overProcessContainer?.activities || [],
    });

    const newData = data.map((process) => {
      if (process.id === activeProcessContainer.id) {
        process = {
          ...process,
          activities: activeOverItems.activeList,
        };
      }
      if (process.id === overProcessContainer.id) {
        process = {
          ...process,
          activities: activeOverItems.overList,
        };
      }
      return process;
    });

    setData(newData);
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
    if (!over?.id || !active?.id) return;

    if (active.data.current.type === 'subprocess') {
      // Drag the subprocess to drop in different process container
      handleDragOverSubProcessFromProcessToProcess({ active, over });
    } else if (active.data.current.type === 'activity') {
      handleDragOverActivity({ active, over });
    }
  };

  const handleDragEndSubProcess = ({ active, over }) => {
    const activeContainer = findProcessContainerBySubProcessId(active.id);
    const overContainer = findProcessContainerBySubProcessId(over?.id);

    if (!activeContainer || !overContainer) {
      setActiveSubProcess(null);
      return;
    }

    const overSubProcessItems = overContainer.subs || [];
    const { activeIndex, overIndex } = findActiveAndOverIndex({
      active,
      over,
      activeList: activeContainer.subs || [],
      overList: overSubProcessItems,
    });

    if (activeIndex !== overIndex) {
      const newData = data.map((process) => {
        if (process.id === overContainer.id) {
          return {
            ...process,
            subs: arrayMove(overSubProcessItems, activeIndex, overIndex),
          };
        }
        return process;
      });

      setData(newData);
    }
  };

  const handleDragEndActivity = ({ active, over }) => {
    if (!over?.id) {
      setActiveActivity(null);
      return;
    }

    const activeSubProcessContainer = findSubProcessContainerByActivityId(active?.id);
    const activeProcessContainer = findProcessContainerByActivityId(active?.id);
    const overSubProcessContainer = findSubProcessContainerByActivityId(over?.id);
    const overProcessContainer = findProcessContainerByActivityId(over?.id);

    if (overSubProcessContainer && activeSubProcessContainer) {
      // Re-order the activity in the same subprocess container
      const overProcessContainerId = over.data.current.processContainerId;
      const overActivityItems = overSubProcessContainer?.activities || [];
      const { activeIndex, overIndex } = findActiveAndOverIndex({
        active,
        over,
        activeList: activeSubProcessContainer?.activities || [],
        overList: overActivityItems,
      });

      if (activeIndex !== overIndex) {
        const newData = data.map((process) => {
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
      const overProcessContainerId = overProcessContainer.id;
      const overActivityItems = overProcessContainer?.activities || [];
      const { activeIndex, overIndex } = findActiveAndOverIndex({
        active,
        over,
        activeList: activeProcessContainer?.activities || [],
        overList: overActivityItems,
      });

      if (activeIndex !== overIndex) {
        const newData = data.map((process) => {
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
    setActiveProcess(null);
    setActiveSubProcess(null);
    setActiveActivity(null);

    const activeType = active.data.current.type;

    if (activeType === 'subprocess') {
      // Re-order the subprocess in the same container
      handleDragEndSubProcess({ active, over });
    } else if (activeType === 'activity') {
      // Re-order the activity in the same container
      handleDragEndActivity({ active, over });
    } else if (activeType === 'process') {
      // Re-order the process
      const { activeIndex, overIndex } = findActiveAndOverIndex({ active, over, activeList: data, overList: data });

      // prevent re-order the single process
      if (activeIndex <= 0 || overIndex <= 0) return;

      if (activeIndex !== overIndex) {
        const newData = arrayMove(data, activeIndex, overIndex);
        setData(newData);
      }
    }
  };

  const handleConfirmDragging = () => {
    setClonedData(structuredClone(data));
    setIsOrderChanged(false);
  };

  const handleUndoDragging = () => {
    setData(structuredClone(clonedData));
    setIsOrderChanged(false);
  };

  return (
    <>
      <div className='px-8 py-4 flex gap-4'>
        <button
          className={clsx('text-white p-3 rounded bg-red-700', !isOrderChanged && 'opacity-35')}
          disabled={!isOrderChanged}
          onClick={handleUndoDragging}
        >
          Undo the dragging
        </button>
        <button
          className={clsx('text-white p-3 rounded bg-green-700', !isOrderChanged && 'opacity-35')}
          disabled={!isOrderChanged}
          onClick={handleConfirmDragging}
        >
          Confirm the dragging
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <SortableContext strategy={verticalListSortingStrategy} items={data?.map((p) => p.id)}>
          <div className='px-8 flex flex-col gap-3'>
            {data.map((process) => (
              <ProcessItem key={process.id} process={process} />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeProcess && <ProcessItem process={activeProcess} />}
          {activeSubProcess && <SubProcessItem subprocess={activeSubProcess} />}
          {activeActivity && (
            <table className='w-full'>
              <Table.Body>
                <Table.RowItem data={activeActivity} />
              </Table.Body>
            </table>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
};

export default MyDND;
