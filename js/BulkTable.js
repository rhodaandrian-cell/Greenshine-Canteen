// ============================================================
// GREENSHINE ACADEMY — Canteen Finance Management System
// BulkTable.jsx — Student rows, checkboxes, search, headers
// ============================================================

function BulkTable({
  grade,
  date,
  setGrade,
  setDate,
  students,
  displayStudents,
  checks,
  done,
  loading,
  search,
  setSearch,
  pendingList,
  toggle,
  costFor,
  rowStatus,
  onProcessAll,
  preparing
}) {
  const GS = window.GREENSHINE || {};
  const TYPES = GS.TYPES || {
    "0": {
      label: "Unranked",
      color: "#888888"
    },
    "A": {
      label: "Prepaid",
      color: "#2ecc71"
    },
    "B": {
      label: "Weekly Tab",
      color: "#3498db"
    },
    "C": {
      label: "Occasional",
      color: "#f39c12"
    },
    "D": {
      label: "Non-paying",
      color: "#e74c3c"
    }
  };

  // Renders a checkbox or 🚫 if already recorded
  const renderCb = (c, done_adm, field, lockedField) => {
    if (c[lockedField]) {
      return /*#__PURE__*/React.createElement("span", {
        title: "Already recorded today",
        style: {
          fontSize: 18,
          cursor: "default",
          userSelect: "none"
        }
      }, "\uD83D\uDEAB");
    }
    return /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "gs-cb",
      checked: !!c[field],
      disabled: !!done_adm,
      onChange: () => toggle(c._admNo, field)
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header",
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCB Bulk Daily Meal Record"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    style: {
      width: "auto"
    },
    value: grade,
    onChange: e => setGrade(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select Class"), (GS.CLASSES || []).map(c => /*#__PURE__*/React.createElement("option", {
    key: c.value,
    value: c.value
  }, c.label))), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: "form-control",
    style: {
      width: "auto"
    },
    value: date,
    onChange: e => setDate(e.target.value)
  }), loading && /*#__PURE__*/React.createElement("span", {
    className: "spinner",
    style: {
      width: 20,
      height: 20,
      borderWidth: 2
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, grade && students.length > 0 && !loading && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: `🔍 Search student in ${grade}...`,
    value: search,
    onChange: e => setSearch(e.target.value),
    style: {
      maxWidth: 320
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--muted)",
      marginBottom: 16
    }
  }, "Tick what each student consumed then click", " ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--light)"
    }
  }, "Process All"), ". \uD83D\uDEAB = already recorded today. \uD83D\uDD25 = frequent eater."), !grade && /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty-icon"
  }, "\uD83D\uDCCB"), /*#__PURE__*/React.createElement("p", null, "Select a class to load students")), grade && loading && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "48px 20px",
      color: "var(--muted)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "spinner",
    style: {
      width: 36,
      height: 36,
      borderWidth: 3,
      margin: "0 auto 12px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13
    }
  }, "Loading ", grade, "...")), grade && !loading && students.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty-icon"
  }, "\uD83D\uDC64"), /*#__PURE__*/React.createElement("p", null, "No students in ", grade)), !loading && displayStudents.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bulk-scroll-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bulk-row header"
  }, /*#__PURE__*/React.createElement("div", null, "Student"), /*#__PURE__*/React.createElement("div", null, "Type"), /*#__PURE__*/React.createElement("div", {
    className: "bulk-header-cell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cell-icon"
  }, "\uD83C\uDF7D\uFE0F"), /*#__PURE__*/React.createElement("div", {
    className: "cell-label label-lunch"
  }, "Lunch"), /*#__PURE__*/React.createElement("div", {
    className: "cell-price"
  }, "KES 50")), /*#__PURE__*/React.createElement("div", {
    className: "bulk-header-cell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cell-icon"
  }, "\u2615"), /*#__PURE__*/React.createElement("div", {
    className: "cell-label label-tea"
  }, "Tea"), /*#__PURE__*/React.createElement("div", {
    className: "cell-price"
  }, "KES 15")), /*#__PURE__*/React.createElement("div", {
    className: "bulk-header-cell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cell-icon"
  }, "\uD83C\uDF3E"), /*#__PURE__*/React.createElement("div", {
    className: "cell-label label-porridge"
  }, "Porridge"), /*#__PURE__*/React.createElement("div", {
    className: "cell-price"
  }, "KES 10")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, "Cost"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, "Status")), /*#__PURE__*/React.createElement("div", {
    id: "bulk-rows"
  }, displayStudents.map((s, idx) => {
    const c = {
      ...(checks[s.admNo] || {}),
      _admNo: s.admNo
    };
    const cost = costFor(s.admNo);
    const status = rowStatus(s);
    const t = TYPES[s.type] || TYPES["0"];
    const bal = s.balance || 0;
    const meals = window.allTxHistory && window.allTxHistory[s.admNo] || 0;
    const flame = meals > 10 ? "🔥 " : "";
    const balCls = bal >= 0 ? "text-success" : "text-danger";
    const isDone = !!done[s.admNo];
    return /*#__PURE__*/React.createElement("div", {
      key: s.admNo,
      id: `bulk-row-${idx}`,
      className: `bulk-row${isDone ? " done" : ""}`
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "bulk-student-name"
    }, flame, s.name), /*#__PURE__*/React.createElement("div", {
      className: "bulk-student-meta"
    }, /*#__PURE__*/React.createElement("span", {
      className: `text-mono ${balCls}`
    }, bulkFmtBal(bal)), meals > 0 ? ` · ${meals} meal${meals !== 1 ? "s" : ""}` : " · no meals yet")), /*#__PURE__*/React.createElement("div", {
      className: "bulk-type-badge"
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge",
      style: {
        background: `${t.color}20`,
        color: t.color,
        border: `1px solid ${t.color}40`,
        fontSize: 11
      }
    }, s.type, " \xB7 ", t.label)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center"
      }
    }, c.foodLocked ? /*#__PURE__*/React.createElement("span", {
      title: "Already recorded today",
      style: {
        fontSize: 18
      }
    }, "\uD83D\uDEAB") : /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "gs-cb",
      checked: !!c.food,
      disabled: isDone,
      onChange: () => toggle(s.admNo, "food")
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center"
      }
    }, c.teaLocked ? /*#__PURE__*/React.createElement("span", {
      title: "Already recorded today",
      style: {
        fontSize: 18
      }
    }, "\uD83D\uDEAB") : /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "gs-cb",
      checked: !!c.tea,
      disabled: isDone,
      onChange: () => toggle(s.admNo, "tea")
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center"
      }
    }, c.porridgeLocked ? /*#__PURE__*/React.createElement("span", {
      title: "Already recorded today",
      style: {
        fontSize: 18
      }
    }, "\uD83D\uDEAB") : /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "gs-cb",
      checked: !!c.porridge,
      disabled: isDone,
      onChange: () => toggle(s.admNo, "porridge")
    })), /*#__PURE__*/React.createElement("div", {
      className: "bulk-cost",
      id: `bulk-cost-${idx}`,
      style: {
        textAlign: "right"
      }
    }, cost > 0 ? `KES ${cost}` : "—"), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right"
      },
      id: `bulk-status-${idx}`
    }, status === "done" && /*#__PURE__*/React.createElement("span", {
      className: "bulk-status-done"
    }, "Done \u2705"), status === "partial" && /*#__PURE__*/React.createElement("span", {
      className: "bulk-status-partial"
    }, "Partial"), status === "pending" && /*#__PURE__*/React.createElement("span", {
      className: "bulk-status-pending"
    }, "Pending")), /*#__PURE__*/React.createElement("div", {
      className: "bulk-checks"
    }, [{
      field: "food",
      lockedField: "foodLocked",
      cls: "bulk-food-m",
      icon: "🍽️",
      label: "Lunch",
      labelCls: "check-label-lunch",
      price: "KES 50"
    }, {
      field: "tea",
      lockedField: "teaLocked",
      cls: "bulk-tea-m",
      icon: "☕",
      label: "Tea",
      labelCls: "check-label-tea",
      price: "KES 15"
    }, {
      field: "porridge",
      lockedField: "porridgeLocked",
      cls: "bulk-porridge-m",
      icon: "🌾",
      label: "Porridge",
      labelCls: "check-label-porridge",
      price: "KES 10"
    }].map(item => /*#__PURE__*/React.createElement("label", {
      key: item.field,
      className: `bulk-check-item${c[item.lockedField] ? " locked-item" : ""}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "check-icon"
    }, item.icon), c[item.lockedField] ? /*#__PURE__*/React.createElement("span", {
      title: "Already recorded today",
      style: {
        fontSize: 18
      }
    }, "\uD83D\uDEAB") : /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: `${item.cls} gs-cb`,
      checked: !!c[item.field],
      disabled: isDone,
      onChange: () => toggle(s.admNo, item.field)
    }), /*#__PURE__*/React.createElement("span", {
      className: `check-label ${item.labelCls}`
    }, item.label), /*#__PURE__*/React.createElement("span", {
      className: "check-price"
    }, item.price))), /*#__PURE__*/React.createElement("div", {
      className: "bulk-footer-row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "bulk-cost",
      id: `bulk-cost-m-${idx}`
    }, cost > 0 ? `KES ${cost}` : "—"), /*#__PURE__*/React.createElement("span", {
      id: `bulk-status-m-${idx}`
    }, status === "done" && /*#__PURE__*/React.createElement("span", {
      className: "bulk-status-done"
    }, "Done \u2705"), status === "partial" && /*#__PURE__*/React.createElement("span", {
      className: "bulk-status-partial"
    }, "Partial"), status === "pending" && /*#__PURE__*/React.createElement("span", {
      className: "bulk-status-pending"
    }, "Pending")))));
  }))), !loading && students.length > 0 && /*#__PURE__*/React.createElement("div", {
    id: "bulk-footer",
    style: {
      marginTop: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--muted)"
    }
  }, pendingList.length > 0 ? `${pendingList.length} student${pendingList.length !== 1 ? "s" : ""} pending` : "All students recorded ✓"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    id: "bulk-process-btn",
    onClick: onProcessAll,
    disabled: pendingList.length === 0 || preparing,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, preparing ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner",
    style: {
      width: 16,
      height: 16,
      borderWidth: 2
    }
  }), " Preparing...") : /*#__PURE__*/React.createElement(React.Fragment, null, "\u2705 Process All (", /*#__PURE__*/React.createElement("span", {
    id: "pending-count"
  }, pendingList.length), " pending)")))));
}
