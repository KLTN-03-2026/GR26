package com.smartfnb;

import com.smartfnb.shared.web.ApiResponse;
import com.smartfnb.shift.application.query.GetShiftScheduleQueryHandler;
import com.smartfnb.shift.application.query.ShiftScheduleResult;
import com.smartfnb.shift.web.controller.ShiftScheduleController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

@WebMvcTest(controllers = ShiftScheduleController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ShiftApiJsonMockTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GetShiftScheduleQueryHandler getScheduleHandler;

    // Các bean khác của controller phải mock
    @MockBean private com.smartfnb.shift.application.command.RegisterShiftCommandHandler registerHandler;
    @MockBean private com.smartfnb.shift.application.command.CheckInCommandHandler checkInHandler;
    @MockBean private com.smartfnb.shift.application.command.CheckOutCommandHandler checkOutHandler;
    
    @Test
    @WithMockUser(roles = "OWNER")
    public void testGetShiftsJson() throws Exception {
        UUID branchId = UUID.fromString("a7fc4472-d5c0-432d-b951-5c78e30fd905");
        
        // Mock dữ liệu có userName
        ShiftScheduleResult mockResult1 = new ShiftScheduleResult(
                UUID.fromString("87f8e483-a277-46c9-84bc-0d32bc15c467"),
                UUID.fromString("2fad705b-e9ba-4f1a-8860-0aa34fc1c580"),
                "Nguyễn Văn A", // userName vừa thêm
                UUID.fromString("b0d746e4-a403-4894-ad3d-f74a082e3308"),
                branchId,
                LocalDate.parse("2026-04-25"),
                "SCHEDULED",
                null, null, null, null, 0, null
        );

        ShiftScheduleResult mockResult2 = new ShiftScheduleResult(
                UUID.fromString("bbe96055-0396-4918-9eea-eaf2b4f9229f"),
                UUID.fromString("c9fbec72-e09a-4924-a9f9-14ffde84b63a"),
                "Trần Thị B", // userName vừa thêm
                UUID.fromString("35ee4fa2-5ef6-4c00-9ff9-82b6b8e80bea"),
                branchId,
                LocalDate.parse("2026-04-25"),
                "SCHEDULED",
                null, null, null, null, 0, null
        );

        when(getScheduleHandler.handleByBranch(any(), any(), any(), any()))
                .thenReturn(List.of(mockResult1, mockResult2));

        mockMvc.perform(get("/api/v1/shifts")
                .param("startDate", "2026-04-20")
                .param("endDate", "2026-04-26")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk());
    }
}
