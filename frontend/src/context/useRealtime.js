import { useContext } from "react";

import RealtimeContext from "./realtimeContext.js";

export const useRealtime = () => {
    const context = useContext(RealtimeContext);

    if (!context) {
        throw new Error("useRealtime must be used inside RealtimeProvider");
    }

    return context;
};
