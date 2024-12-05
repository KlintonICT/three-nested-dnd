export const initData = [
  {
    id: 'single',
    name: 'Single Activities',
    activities: [
      { id: 'a1', name: 'Activity 1' },
      { id: 'a11', name: 'Activity 11' },
    ],
    subs: [],
  },
  {
    id: 'p2',
    name: 'Process 2',
    activities: [
      { id: 'a2', name: 'Activity 2' },
      { id: 'a22', name: 'Activity 22' },
    ],
    subs: [
      {
        id: "s1",
        name: "Subprocess 1",
        activities: [
          { id: "a3", name: "Activity 3" }
        ],
      },
      {
        id: "s2",
        name: "Subprocess 2",
        activities: [
          { id: "a4", name: "Activity 4" }
        ],
      },
    ],
  },
  {
    id: 'p3',
    name: 'Process 3',
    activities: [
      { id: "a5", name: "Activity 5" }
    ],
    subs: [
      {
        id: 's3',
        name: 'Subprocess 3',
        activities: [
          { id: "a6", name: "Activity 6" },
          { id: "a61", name: "Activity 61" },
        ],
      },
      {
        id: 's4',
        name: 'Subprocess 4',
        activities: [
          { id: 'a7', name: 'Activity 7' },
          { id: 'a8', name: 'Activity 8' },
        ],
      },
    ],
  },
];
