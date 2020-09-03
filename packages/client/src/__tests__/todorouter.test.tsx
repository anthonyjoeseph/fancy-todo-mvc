import * as assert from 'assert';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MockableApp from '../components/MockableApp';
import { format, Location } from '../logic/Location';

test('New filters change the url', () => {
  let allPushedLocations: string[] = [];

  render(
    <MockableApp
      pushUrl={(url) => {
        allPushedLocations.push(url)
      }}
    />
  );

  const showCompletedTodos = screen.getByText(/Completed/i);
  expect(showCompletedTodos).toBeInTheDocument();
  const showActiveTodos = screen.getByText(/Active/i);
  expect(showActiveTodos).toBeInTheDocument();
  const showAllTodos = screen.getByText(/All/i);
  expect(showAllTodos).toBeInTheDocument();

  fireEvent.click(showCompletedTodos);
  fireEvent.click(showActiveTodos);
  fireEvent.click(showAllTodos);

  assert.deepStrictEqual(
    allPushedLocations,
    [
      Location.of.Completed({ value: {} }),
      Location.of.Active({ value: {} }),
      Location.of.Landing({ value: {} }),
    ].map(format)
  );

});