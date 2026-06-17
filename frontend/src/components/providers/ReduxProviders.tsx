import { Provider } from "react-redux";
import { store } from "../../redux/store.ts";

const ReduxProviders = ({ children }: any) => {
  return (
    <>
      <Provider store={store}>{children}</Provider>
    </>
  );
};

export default ReduxProviders;
