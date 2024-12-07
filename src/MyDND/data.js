export const initData = [
  {
    id: 'single',
    name: 'Single Process',
    activities: [
      { id: 'A1', name: 'Activity 1' },
      { id: 'A2', name: 'Activity 2' },
    ],
    subs: [],
  },
  {
    id: 'p2',
    name: 'Process 2',
    activities: [
      { id: 'A3', name: 'Activity 3' },
      { id: 'A4', name: 'Activity 4' },
    ],
    subs: [
      {
        id: "s1",
        name: "Sub Process 1",
        activities: [
          { id: "A5", name: "Activity 5" }
        ],
      },
      {
        id: "s2",
        name: "Sub Process 2",
        activities: [
          { id: "A6", name: "Activity 6" }
        ],
      },
    ],
  },
  {
    id: 'p3',
    name: 'Process 3',
    activities: [
      { id: "A7", name: "Activity 7" }
    ],
    subs: [
      {
        id: 's3',
        name: 'Sub Process 3',
        activities: [
          { id: "A8", name: "Activity 8" },
          { id: "A9", name: "Activity 9" },
        ],
      },
      {
        id: 's4',
        name: 'Sub Process 4',
        activities: [
          { id: 'A10', name: 'Activity 10' },
          { id: 'A11', name: 'Activity 11' },
        ],
      },
    ],
  }
];
