import React from "react";
import isEmpty from "lodash/isEmpty";
import has from "lodash/has";
import get from "lodash/get";
import maxBy from "lodash/maxBy";
import findIndex from "lodash/findIndex";
import includes from "lodash/includes";
import sortBy from "lodash/sortBy";
import Timeline from "react-calendar-timeline";
import moment from "moment";
import "react-calendar-timeline/lib/Timeline.css";
import "./styles.css";
import { arrayOfDeffered } from "redux-saga/utils";

const SagaMonitorView = props => {
  const keys = {
    groupIdKey: "id",
    groupTitleKey: "title",
    groupRightTitleKey: "rightTitle",
    groupLabelKey: "title", // key for what to show in `InfoLabel`
    itemIdKey: "id",
    itemTitleKey: "title", // key for item div content
    itemDivTitleKey: "title", // key for item div title (<div title="text"/>)
    itemGroupKey: "group",
    itemTimeStartKey: "start_time",
    itemTimeEndKey: "end_time"
  };
  const getRandomColor = () => {
    return "#" + (((1 << 24) * Math.random()) | 0).toString(16);
  };

  const groupRenderer = ({ group }) => {
    return (
      <div className="custom-group">
        <span className="title">{group.title}</span>
        <p className="tip">{group.title}</p>
      </div>
    );
  };

  const itemRenderer = ({
    item,
    itemContext,
    getItemProps,
    getResizeProps
  }) => {
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
    const backgroundColor = itemContext.selected
      ? itemContext.dragging
        ? "red"
        : item.selectedBgColor
      : item.bgColor;
    const borderColor = itemContext.resizing ? "red" : item.color;
    return (
      <div
        {...getItemProps({
          style: {
            backgroundColor,
            color: item.color,
            borderColor,
            borderStyle: "solid",
            borderWidth: 1,
            borderRadius: 4,
            borderLeftWidth: itemContext.selected ? 3 : 1,
            borderRightWidth: itemContext.selected ? 3 : 1
          },
          onMouseDown: () => {
            console.log("on item click", item);
          }
        })}
      >
        {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : null}

        <div
          style={{
            height: itemContext.dimensions.height,
            overflow: "hidden",
            paddingLeft: 3,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {itemContext.title}
        </div>

        {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : null}
      </div>
    );
  };

  const getParentInfo = parentList => {
    console.log("console: parentList", parentList);
    let arr = [];
    parentList.forEach(k => {
      arr.push(
        Object.values(props.state.effectsById).find(
          el =>
            el.effectId === k &&
            el.status === "STATUS_RESOLVED" &&
            (has(el, 'effect["FORK"]') || has(el, 'effect["FORK"]'))
        )
      );
    });
    return arr.filter(e => !isEmpty(e))[0];
  };

  const filterData = flat => {
    let filteredArray = [];
    console.log("console: flatflat", flat);
    let idx = !isEmpty(props.state.filtered)
      ? maxBy(props.state.filtered, el => el.idx).idx + 1
      : 1;

    Object.entries(flat).forEach(k => {
      const e = k[1];
      console.log("console: -------------------", e);
      if (isEmpty(e.name)) {
        e.title =
          "action-" +
          idx +
          ": " +
          get(e, "action.payload.pathname", " - ") +
          get(e, "action.type", "");
        //e.effectId = idx + '-' + get(e, 'action.type', 'hz');
        e.start = e.time;
        e.end = e.time;
        filteredArray.push(e);
      }
      //e.idx = idx;
      if (
        e.name === "effectTriggered" &&
        (!isEmpty(get(e, 'effect["PUT"]')) ||
          !isEmpty(get(e, 'effect["FORK"].args')) ||
          !isEmpty(get(e, 'effect["TAKE"].pattern')))
      ) {
        // if (!isEmpty(get(e, 'effect["FORK"].args'))) {
        //   e.title = 'FORK: ' + get(e.effect["FORK"], 'args[0].type', e.effect["FORK"].args[0]) + ' ' + get(e.effect["FORK"], 'args[1].name', '');
        //   filteredArray.push(e);
        // }

        if (!isEmpty(get(e, 'effect["PUT"]'))) {
          let putParent = {};
          Object.entries(props.state.effectsById).forEach(el => {
            if (el[1].effectId === e.parentEffectId) putParent = el[1];
          });

          //const putParent = getParentInfo(e.path.reverse());

          console.log("console: putParent", putParent);
          let watcher,
            action = "";
          if (!isEmpty(putParent)) {
            e.parentEffectId = putParent.effectId;
            if (has(putParent, 'effect["FORK"]'))
              watcher = putParent.effect["FORK"].fn.name;
            if (has(putParent, 'effect["FORK"]'))
              action = putParent.effect["FORK"].args[0].type;
          }

          e.groupData =
            idx +
            " - " +
            action +
            " - " +
            watcher +
            " PUT: " +
            get(e.effect["PUT"], "action.type");
          e.end = e.start;
          e.title =
            ".effect-" +
            get(putParent, "effectId", "-" + idx + "-") +
            " - " +
            action +
            " - " +
            watcher +
            " PUT: " +
            get(e.effect["PUT"], "action.type");
          filteredArray.push(e);
        }
        // if (!isEmpty(get(e, 'effect["TAKE"].pattern'))) {
        //   e.title = 'TAKE: ' + e.effect["TAKE"].pattern;
        //   filteredArray.push(e);
        // }
      }
      if (
        e.name === "effectResolved" &&
        (!isEmpty(get(e, "result.type")) || !isEmpty(get(e, "result.name")))
      ) {
        const obj = Object.entries(flat).forEach(
          el =>
            has(e, "result.type") &&
            has(el[1], "action.type") &&
            e.result.type === el.action.type &&
            el[1].name === "actionDispatched"
        );

        if (!isEmpty(obj)) obj[0].end_time = e.time;
        //console.log('console: obj', obj);
        // if (e.result.name !== 'rootSaga' && e.result.name !== 'sagas' && e.result.name !== 'takeLatest') {
        //   e.title = 'RESOLVED: ' + get(e, 'result.name', '') + get(e, 'result.type', '');
        //   filteredArray.push(e);
        // }
      }
      //idx++;
    });
    const sorted = sortBy(filteredArray, ["idx", "title"]);

    props.state.filtered = props.state.filtered.concat(sorted);
    //props.state.dispatchedActions = [];
    //props.state.effectsById = [];
    return props.state.filtered; //sortBy(filteredArray, ['start', 'title']);
  };

  const getData = saga => {
    if (isEmpty(saga)) saga = [];
    const data = [];
    console.log("console: getData - start", saga);
    Object.entries(saga).forEach(k => {
      console.log("console: kkkkkkkkkkkkkkkkkkk", k);
      const newEl = {};
      const e = k[1];
      e.id = e.idx;
      newEl.id = e.idx;
      newEl.group = e.idx; //e.parentEffectId || "";
      //newEl.group = !isEmpty(e.path) ? saga[idx-1].effectId : e.effectId;
      //newEl.group = e.effectId;
      newEl.title = e.title;
      newEl.start_time = moment(new Date(e.start));
      newEl.end_time = moment(new Date(e.end)) || moment(new Date(e.start));
      newEl.canMove = true;
      newEl.canResize = true;
      newEl.canChangeGroup = true;
      // // newEl.selectedBgColor = getRandomColor();
      // newEl.bgColor = getRandomColor();
      // newEl.borderColor = getRandomColor();
      //newEl.rightTitle = get(e, 'result', '');
      newEl.itemProps = {
        "data-tip": e.title
      };
      newEl.details = e;

      data.push(newEl);
    });
    console.log("console: getData - end", data);
    return data;
  };

  const getGroups = saga => {
    if (isEmpty(saga)) saga = [];
    const group = [];
    Object.entries(saga).forEach(k => {
      const e = k[1];

      //if (isEmpty(e.path)) {
      group.push({
        id: e.idx,
        title: e.title,
        //stackItems: true,
        rightTitle: e.title
        //bgColor: getRandomColor(),
        //rightTitle: get(e, 'result', ''),
        //height: 140
      });
      //}
    });
    console.log("console: group", group);
    return group;
  };

  const getFullObj = () => {
    console.log("console: getFullObj - start", props);

    const lastFiltered = props.state.filtered[props.state.filtered.length - 1];
    console.log("console: lastFiltered", lastFiltered);
    console.log(
      "console: props.state.dispatchedActions",
      props.state.dispatchedActions
    );
    console.log("console: props.state.effectsById", props.state.effectsById);
    const dispatched = !isEmpty(lastFiltered)
      ? props.state.dispatchedActions.filter(e => e.idx > lastFiltered.idx)
      : props.state.dispatchedActions;
    dispatched.map(el => (el.id = el.idx));

    console.log("console: dispatched", dispatched);
    const fullObj = [...dispatched];
    let newObj = [];
    !isEmpty(lastFiltered)
      ? Object.entries(props.state.effectsById).forEach(k => {
          if (k[1].idx > lastFiltered.idx) {
            newObj.push(k[1]);
          }
        })
      : (newObj = props.state.effectsById);

    Object.entries(newObj).forEach(k => {
      fullObj.push(k[1]);
    });
    console.log("console: fullObj", fullObj);
    return fullObj;
  };

  const filtered = filterData(getFullObj());

  return (
    <div style={{ background: "white" }}>
      <Timeline
        groups={getGroups(filtered)}
        sidebarWidth={0}
        items={getData(filtered)}
        defaultTimeStart={moment().add(-1, "minute")}
        defaultTimeEnd={moment().add(1, "minute")}
        itemRenderer={itemRenderer}
        //groupRenderer={groupRenderer}
        stackItems
        itemHeightRatio={0.75}
        showCursorLine
        keys={keys}
        //rightSidebarWidth={150}
        //dimensions={{ width: '1000px' }}
        //onItemClick={onItemClick}
      />
    </div>
  );
};

export default SagaMonitorView;
