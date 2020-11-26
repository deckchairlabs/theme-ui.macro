declare module "@theme-ui/css" {
    export interface Theme {
        colors: {
            primary: "red";
            secondary: "blue";
            black: "#000";
            highlight: "colors.primary";
        };
        space: {
            0: 0;
            1: 4;
            2: 8;
            3: 16;
            4: "50%";
            5: 0.4;
        };
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