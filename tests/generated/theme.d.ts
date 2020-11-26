import { Theme } from "@theme-ui/css";
declare module "@theme-ui/css" {
    export interface Theme {
        colors: {
            primary: "red";
            secondary: "blue";
            black: "#000";
            highlight: "colors.primary";
        };
        space: [
            0,
            4,
            8,
            16
        ];
        buttons: {
            base: {
                padding: [
                    2,
                    3
                ];
            };
        };
    }
}
