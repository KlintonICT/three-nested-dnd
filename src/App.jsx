import MultipleContainers from "./MultipleContainer";
import MyDND from "./MyDND";
import ThreeNestedDND from "./ThreeNestedDnd";

const App = () => {
  return (
    <div className="bg-[#21265F]">
      <MyDND />
      {/* <MultipleContainers /> */}
      <ThreeNestedDND />
    </div>
  );
};

export default App;
