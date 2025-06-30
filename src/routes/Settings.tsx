// route("/settings");

import {
  Container,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { ReactElement } from "react";
import { useConfigStore, useHydration } from "@/stores";
import { NumberFormatValues, NumericFormat } from "react-number-format";
import { SpeedDial } from "@/components";
import { State } from "@/stores/useConfigStore";

type NumberKeysOf<T> = {
  [P in keyof T as T[P] extends number ? P : never]: T[P];
};

interface NumericInputProps {
  label: string;
  stateKey: keyof NumberKeysOf<State>;
  isAllowed?: (values: NumberFormatValues) => boolean;
}
const NumericInput = (props: NumericInputProps) => {
  const setState = useConfigStore.setState;
  const value = useConfigStore.use[props.stateKey]();
  return (
    <NumericFormat
      label={props.label}
      defaultValue={value}
      customInput={TextField}
      isAllowed={props.isAllowed}
      onValueChange={(values: NumberFormatValues) => {
        if (values.floatValue !== undefined) {
          setState({ [props.stateKey]: values.floatValue });
        }
      }}
    />
  );
};
export const Settings = (): ReactElement => {
  const hydrated = useHydration();
  const enableClassify = useConfigStore.use.enableClassify();
  const setState = useConfigStore.setState;

  if (!hydrated) {
    return <></>;
  }

  return (
    <>
      <Container sx={{ paddingTop: "5%" }}>
        <Stack spacing={2}>
          <NumericInput
            label="Batch Size"
            stateKey="batchSize"
            isAllowed={(values) => {
              const { floatValue } = values;
              return (
                floatValue !== undefined &&
                floatValue > 0 &&
                Number.isInteger(floatValue)
              );
            }}
          />
          <NumericInput label="PCM Threshold" stateKey="pcmThreshold" />
          <NumericInput label="Time Threshold" stateKey="timeThreshold" />
          <FormGroup>
            <FormControlLabel
              control={<Switch />}
              label="Enable Classification"
              checked={enableClassify}
              onChange={(_, checked) => {
                setState({ enableClassify: checked });
              }}
            />
          </FormGroup>
          {enableClassify && (
            <NumericInput
              label="Probability Threshold"
              stateKey="probThreshold"
              isAllowed={(values) => {
                const { floatValue } = values;
                return (
                  floatValue !== undefined && floatValue > 0 && floatValue < 1
                );
              }}
            />
          )}
        </Stack>
      </Container>
      <SpeedDial />
    </>
  );
};
